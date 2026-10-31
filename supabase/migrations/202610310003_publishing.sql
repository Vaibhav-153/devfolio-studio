-- Phase 4: immutable public images, atomic public release activation and owner-only rollback.
-- Apply AFTER the Phase 1 and Phase 2 migrations. Production verification still requires real Supabase staging.
begin;

-- Never allow ordinary clients to upload, rewrite, or remove published assets.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-public','portfolio-public',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
-- NOTE: service-role publication will bypass storage RLS. No authenticated upload/update/delete policy is added.

-- Remove the legacy publishing endpoint; it omitted project image references.
revoke execute on function public.publish_portfolio(uuid) from public,anon,authenticated;

-- Build stable, namespaced object paths from database-owned images. No client-supplied asset URLs.
create or replace function public.published_image_path(p_portfolio_id uuid,p_batch_id uuid,p_asset_id uuid,p_mime text)
returns text language sql immutable set search_path='' as $$
 select p_portfolio_id::text||'/'||p_batch_id::text||'/'||p_asset_id::text||
 case p_mime when 'image/png' then '.png' when 'image/jpeg' then '.jpg' when 'image/webp' then '.webp' else '.invalid' end;
$$;
revoke all on function public.published_image_path(uuid,uuid,uuid,text) from public,anon,authenticated;

create or replace function public.publish_portfolio_v2(p_portfolio_id uuid,p_batch_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare
 p public.portfolios%rowtype;
 next_version integer;
 original jsonb;
 enriched_projects jsonb;
begin
 if p_batch_id is null then raise exception 'Invalid publication batch' using errcode='22023';end if;
 select * into p from public.portfolios where id=p_portfolio_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Not authorized' using errcode='42501';end if;
 if (select count(*) from public.projects where portfolio_id=p.id and visible)>100 then
   raise exception 'Too many visible projects for the current release' using errcode='22023';end if;
 if (select count(*) from public.portfolio_pages where portfolio_id=p.id)>12 then
   raise exception 'Too many pages for the current release' using errcode='22023';end if;
 -- A private signed Storage URL must never be frozen into a public layout.
 if exists (select 1 from public.portfolio_pages pg join public.page_drafts d on d.page_id=pg.id
   where pg.portfolio_id=p.id and (d.layout_json::text ilike '%portfolio-drafts%'
     or d.layout_json::text ilike '%/storage/v1/object/sign/%')) then
   raise exception 'A layout contains a private or expiring media URL. Use a public HTTPS image instead.' using errcode='22023';end if;
 if (select count(distinct pm.asset_id) from public.project_media pm
      join public.projects pr on pr.id=pm.project_id and pr.portfolio_id=p.id and pr.visible
      where pm.portfolio_id=p.id)>24 then
   raise exception 'Public image limit is 24 assets in this beta' using errcode='22023';end if;
 -- Every referenced image must belong to this portfolio and have been copied into the
 -- exact immutable destination path for this batch before activation is allowed.
 if exists (
  select 1 from public.project_media pm
   join public.projects pr on pr.id=pm.project_id and pr.portfolio_id=p.id and pr.visible
   left join public.media_assets a on a.id=pm.asset_id and a.portfolio_id=p.id
   where pm.portfolio_id=p.id and (
     a.id is null or a.kind<>'image' or a.upload_status<>'ready' or
     a.mime_type not in ('image/png','image/jpeg','image/webp') or
     not exists(select 1 from storage.objects o
       where o.bucket_id='portfolio-public'
         and o.name=public.published_image_path(p.id,p_batch_id,a.id,a.mime_type))
   )
 ) then raise exception 'A project image is not prepared for this publication' using errcode='22023';end if;

 -- The existing Phase 2 implementation creates the complete content/layout snapshot
 -- under the same transaction. It is revoked from authenticated clients above.
 next_version:=public.publish_portfolio(p_portfolio_id);
 select r.snapshot_json into original from public.published_releases r
  where r.portfolio_id=p.id and r.version=next_version for update;

 select coalesce(jsonb_agg(
   item.project || jsonb_build_object(
    'coverPath',coalesce((select public.published_image_path(p.id,p_batch_id,a.id,a.mime_type)
      from public.project_media pm join public.media_assets a on a.id=pm.asset_id and a.portfolio_id=p.id
      where pm.portfolio_id=p.id and pm.project_id=(item.project->>'id')::uuid and pm.is_cover
      limit 1),''),
    'gallery',coalesce((select jsonb_agg(jsonb_build_object(
      'path',public.published_image_path(p.id,p_batch_id,a.id,a.mime_type),
      'alt',pm.alt_text,'caption',pm.caption) order by pm.sort_order,pm.id)
      from public.project_media pm join public.media_assets a on a.id=pm.asset_id and a.portfolio_id=p.id
      where pm.portfolio_id=p.id and pm.project_id=(item.project->>'id')::uuid),'[]'::jsonb)
   ) order by item.ordinality),'[]'::jsonb) into enriched_projects
 from jsonb_array_elements(original->'projects') with ordinality as item(project,ordinality);

 update public.published_releases
  set snapshot_json=jsonb_set(original,'{projects}',enriched_projects)
  where portfolio_id=p.id and version=next_version;
 insert into public.audit_events(portfolio_id,actor_id,event_type)
   values(p.id,auth.uid(),'publish_media_verified');
 return next_version;
end;$$;
revoke all on function public.publish_portfolio_v2(uuid,uuid) from public,anon;
grant execute on function public.publish_portfolio_v2(uuid,uuid) to authenticated;

-- Rollback is a NEW version copying an older snapshot, not a destructive edit to history.
create or replace function public.restore_portfolio_release(p_portfolio_id uuid,p_source_release_id uuid)
returns integer language plpgsql security definer set search_path='' as $$
declare p public.portfolios%rowtype; previous jsonb; new_version integer; new_release_id uuid;
begin
 select * into p from public.portfolios where id=p_portfolio_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Not authorized' using errcode='42501';end if;
 select snapshot_json into previous from public.published_releases
  where id=p_source_release_id and portfolio_id=p.id;
 if previous is null then raise exception 'Release not found' using errcode='22023';end if;
 select coalesce(max(version),0)+1 into new_version from public.published_releases where portfolio_id=p.id;
 insert into public.published_releases(portfolio_id,version,snapshot_json)
  values(p.id,new_version,previous) returning id into new_release_id;
 update public.portfolios set active_release_id=new_release_id,status='published',updated_at=now() where id=p.id;
 insert into public.audit_events(portfolio_id,actor_id,event_type)
  values(p.id,auth.uid(),'restore_release');
 return new_version;
end;$$;
revoke all on function public.restore_portfolio_release(uuid,uuid) from public,anon;
grant execute on function public.restore_portfolio_release(uuid,uuid) to authenticated;

-- Revalidate owner-only reading while retaining immutability of published_releases.
-- No INSERT / UPDATE / DELETE grants exist for authenticated users on release history.
commit;
