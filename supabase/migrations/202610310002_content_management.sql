-- Phase 2: structured portfolio content and private project media.
-- Apply AFTER 202610310001_initial.sql. Does not require service-role keys in the browser.
begin;

create table public.project_categories (
 id uuid primary key default gen_random_uuid(),
 portfolio_id uuid not null references public.portfolios(id) on delete cascade,
 name text not null check (char_length(btrim(name)) between 1 and 60),
 slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 sort_order integer not null default 0,
 created_at timestamptz not null default now(),
 unique(portfolio_id,slug), unique(portfolio_id,id)
);
create index project_categories_portfolio_idx on public.project_categories(portfolio_id,sort_order);

alter table public.projects
 add column problem text not null default '' check(char_length(problem)<=3000),
 add column solution text not null default '' check(char_length(solution)<=3000),
 add column contribution text not null default '' check(char_length(contribution)<=2000),
 add column outcome text not null default '' check(char_length(outcome)<=2000),
 add column featured boolean not null default false,
 add column visible boolean not null default true,
 add column category_id uuid;
alter table public.projects add constraint projects_portfolio_id_id_unique unique(portfolio_id,id);
alter table public.projects add constraint project_category_same_portfolio foreign key(portfolio_id,category_id)
 references public.project_categories(portfolio_id,id) on delete no action;

alter table public.media_assets
 add column file_name text not null default '' check(char_length(file_name)<=200),
 add column mime_type text not null default '' check(char_length(mime_type)<=100),
 add column byte_size integer not null default 0 check(byte_size between 0 and 5242880),
 add column kind text not null default 'image' check(kind in ('image','resume')),
 add column upload_status text not null default 'pending' check(upload_status in ('pending','ready')),
 add column published_path text;
alter table public.media_assets add constraint media_assets_portfolio_id_id_unique unique(portfolio_id,id);

create table public.project_media (
 id uuid primary key default gen_random_uuid(),
 portfolio_id uuid not null references public.portfolios(id) on delete cascade,
 project_id uuid not null,
 asset_id uuid not null,
 alt_text text not null default '' check(char_length(alt_text)<=180),
 caption text not null default '' check(char_length(caption)<=240),
 sort_order integer not null default 0,
 is_cover boolean not null default false,
 unique(project_id,asset_id),
 constraint media_project_same_portfolio foreign key(portfolio_id,project_id)
   references public.projects(portfolio_id,id) on delete cascade,
 constraint media_asset_same_portfolio foreign key(portfolio_id,asset_id)
   references public.media_assets(portfolio_id,id) on delete restrict
);
create unique index project_media_one_cover on public.project_media(project_id) where is_cover;
create index project_media_ordered on public.project_media(project_id,sort_order);

create table public.experience_entries (
 id uuid primary key default gen_random_uuid(),
 portfolio_id uuid not null references public.portfolios(id) on delete cascade,
 organization text not null check(char_length(btrim(organization)) between 1 and 130),
 position text not null check(char_length(btrim(position)) between 1 and 130),
 location text not null default '' check(char_length(location)<=120),
 employment_type text not null default '' check(char_length(employment_type)<=60),
 started_on date,
 ended_on date,
 is_current boolean not null default false,
 description text not null default '' check(char_length(description)<=3000),
 sort_order integer not null default 0,
 constraint valid_experience_dates check(ended_on is null or started_on is null or ended_on>=started_on)
);
create index experience_ordered on public.experience_entries(portfolio_id,sort_order);
create table public.education_entries (
 id uuid primary key default gen_random_uuid(),
 portfolio_id uuid not null references public.portfolios(id) on delete cascade,
 institution text not null check(char_length(btrim(institution)) between 1 and 150),
 qualification text not null check(char_length(btrim(qualification)) between 1 and 150),
 field_of_study text not null default '' check(char_length(field_of_study)<=130),
 started_year integer check(started_year between 1950 and 2100),
 ended_year integer check(ended_year between 1950 and 2100),
 description text not null default '' check(char_length(description)<=2000),
 sort_order integer not null default 0,
 constraint valid_education_years check(ended_year is null or started_year is null or ended_year>=started_year)
);
create index education_ordered on public.education_entries(portfolio_id,sort_order);
create table public.certifications (
 id uuid primary key default gen_random_uuid(),
 portfolio_id uuid not null references public.portfolios(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 1 and 150),
 issuer text not null default '' check(char_length(issuer)<=130),
 issued_on date,
 verify_url text not null default '' check(char_length(verify_url)<=2048),
 description text not null default '' check(char_length(description)<=1200),
 sort_order integer not null default 0
);
create index certifications_ordered on public.certifications(portfolio_id,sort_order);
create table public.skill_groups (
 id uuid primary key default gen_random_uuid(),
 portfolio_id uuid not null references public.portfolios(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 1 and 90),
 sort_order integer not null default 0,
 unique(portfolio_id,id)
);
create index skill_groups_ordered on public.skill_groups(portfolio_id,sort_order);
create table public.skills (
 id uuid primary key default gen_random_uuid(),
 portfolio_id uuid not null references public.portfolios(id) on delete cascade,
 group_id uuid not null,
 name text not null check(char_length(btrim(name)) between 1 and 55),
 sort_order integer not null default 0,
 constraint skills_same_portfolio foreign key(portfolio_id,group_id)
   references public.skill_groups(portfolio_id,id) on delete cascade,
 unique(group_id,name)
);
create index skills_ordered on public.skills(portfolio_id,group_id,sort_order);

-- Restrict relational attachments to valid, completely uploaded image assets.
create or replace function public.validate_project_media() returns trigger
language plpgsql set search_path = '' as $$
begin
 if not exists(select 1 from public.media_assets a
   where a.id=new.asset_id and a.portfolio_id=new.portfolio_id
     and a.kind='image' and a.upload_status='ready') then
  raise exception 'Only uploaded images belonging to this portfolio can be attached';
 end if;
 return new;
end;$$;
create trigger project_media_valid_image before insert or update of asset_id,portfolio_id on public.project_media
 for each row execute function public.validate_project_media();

-- Keep legacy project.category text synchronized for Phase 1 renderer compatibility.
create or replace function public.sync_project_category() returns trigger
language plpgsql set search_path = '' as $$
begin
 if new.category_id is not null then
   select name into new.category from public.project_categories
    where id=new.category_id and portfolio_id=new.portfolio_id;
   if new.category is null then raise exception 'Invalid category'; end if;
 end if;
 return new;
end;$$;
create trigger sync_project_category_name before insert or update of category_id on public.projects
 for each row execute function public.sync_project_category();
create or replace function public.propagate_category_rename() returns trigger
language plpgsql set search_path = '' as $$
begin
 if new.name is distinct from old.name then
  update public.projects set category=new.name where category_id=new.id and portfolio_id=new.portfolio_id;
 end if;
 return new;
end;$$;
create trigger propagate_category_name after update of name on public.project_categories
 for each row execute function public.propagate_category_rename();

-- Deletion of a category is explicitly handled by the app: linked projects are reassigned first.
-- No user can attach another tenant's category, image or skill group via forged IDs.
do $$ declare t text; begin
 foreach t in array array['project_categories','project_media','experience_entries','education_entries','certifications','skill_groups','skills'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  execute format('create policy %I on public.%I for select to authenticated using (exists (select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())))',t||'_owner_select',t);
  execute format('create policy %I on public.%I for insert to authenticated with check (exists (select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())))',t||'_owner_insert',t);
  execute format('create policy %I on public.%I for update to authenticated using (exists (select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid()))) with check (exists (select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())))',t||'_owner_update',t);
  execute format('create policy %I on public.%I for delete to authenticated using (exists (select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())))',t||'_owner_delete',t);
 end loop;
end $$;

-- Users can register an upload intent, but cannot forge ready or published media states.
revoke all on public.media_assets from authenticated;
grant select,delete on public.media_assets to authenticated;
grant insert (portfolio_id,owner_id,storage_path,alt_text,file_name,mime_type,byte_size,kind)
  on public.media_assets to authenticated;
grant update (alt_text) on public.media_assets to authenticated;
create or replace function public.complete_media_upload(p_asset_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
declare a public.media_assets%rowtype; obj storage.objects%rowtype;
begin
 select a.* into a from public.media_assets a join public.portfolios p on p.id=a.portfolio_id
  where a.id=p_asset_id and p.owner_id=auth.uid() and a.owner_id=auth.uid();
 if not found then raise exception 'Asset not found' using errcode='42501'; end if;
 select * into obj from storage.objects where bucket_id='portfolio-drafts' and name=a.storage_path;
 if not found then raise exception 'Upload file before confirming' using errcode='22023';end if;
 if a.kind='image' and a.mime_type not in ('image/jpeg','image/png','image/webp') then
   raise exception 'Only JPEG, PNG and WebP images are allowed';end if;
 if a.kind='resume' and a.mime_type<>'application/pdf' then raise exception 'Résumé must be a PDF';end if;
 if a.byte_size<1 or a.byte_size>5242880 then raise exception 'Invalid file size';end if;
 update public.media_assets set upload_status='ready' where id=a.id;
 return true;
end;$$;
revoke all on function public.complete_media_upload(uuid) from public,anon;
grant execute on function public.complete_media_upload(uuid) to authenticated;

-- Snapshot publishing remains server-controlled and includes new non-private content.
-- Private draft media is intentionally excluded until Phase 4 asset promotion is implemented.
create or replace function public.publish_portfolio(p_portfolio_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare p public.portfolios%rowtype; person public.portfolio_profiles%rowtype;
 next_version integer; release_id uuid; snap jsonb; skills_flat jsonb;
begin
 select * into p from public.portfolios where id=p_portfolio_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into person from public.portfolio_profiles where portfolio_id=p.id;
 if p.handle is null or person.name='' or person.role='' then
  raise exception 'A username, name and role are required to publish' using errcode='22023';end if;
 if not exists(select 1 from public.projects where portfolio_id=p.id and visible) then
  raise exception 'Add at least one visible project before publishing' using errcode='22023';end if;
 select coalesce(jsonb_agg(s.name order by sg.sort_order,s.sort_order), '[]'::jsonb) into skills_flat
   from public.skills s join public.skill_groups sg on sg.id=s.group_id where s.portfolio_id=p.id;
 if jsonb_array_length(skills_flat)=0 then skills_flat:=to_jsonb(person.skills);end if;
 select coalesce(max(version),0)+1 into next_version from public.published_releases where portfolio_id=p.id;
 select jsonb_build_object(
  'schemaVersion',1,'template',p.template,
  'site',jsonb_build_object('name',person.name,'role',person.role,'heroOne',person.hero_one,
     'heroTwo',person.hero_two,'intro',person.intro,'about',person.about,'email',person.email,
     'github',person.github,'linkedin',person.linkedin,'skills',skills_flat),
  'projects',coalesce((select jsonb_agg(jsonb_build_object(
     'id',pr.id,'title',pr.title,'slug',pr.slug,'category',pr.category,'summary',pr.summary,
     'tech',to_jsonb(pr.tech),'github',pr.github,'demo',pr.demo,'problem',pr.problem,
     'solution',pr.solution,'contribution',pr.contribution,'outcome',pr.outcome,
     'featured',pr.featured,'visible',pr.visible) order by pr.featured desc,pr.sort_order,pr.created_at)
     from public.projects pr where pr.portfolio_id=p.id and pr.visible),'[]'::jsonb),
  'experience',coalesce((select jsonb_agg(to_jsonb(e)-'portfolio_id' order by e.sort_order,e.started_on desc)
     from public.experience_entries e where e.portfolio_id=p.id),'[]'::jsonb),
  'education',coalesce((select jsonb_agg(to_jsonb(e)-'portfolio_id' order by e.sort_order)
     from public.education_entries e where e.portfolio_id=p.id),'[]'::jsonb),
  'certifications',coalesce((select jsonb_agg(to_jsonb(c)-'portfolio_id' order by c.sort_order)
     from public.certifications c where c.portfolio_id=p.id),'[]'::jsonb),
  'skillGroups',coalesce((select jsonb_agg(jsonb_build_object('id',sg.id,'name',sg.name,
     'skills',coalesce((select jsonb_agg(s.name order by s.sort_order) from public.skills s where s.group_id=sg.id),'[]'::jsonb)) order by sg.sort_order)
     from public.skill_groups sg where sg.portfolio_id=p.id),'[]'::jsonb),
  'pages',coalesce((select jsonb_agg(jsonb_build_object('key',pg.page_key,'title',pg.title,'layout',d.layout_json) order by pg.sort_order)
     from public.portfolio_pages pg join public.page_drafts d on d.page_id=pg.id where pg.portfolio_id=p.id),'[]'::jsonb)
 ) into snap;
 insert into public.published_releases(portfolio_id,version,snapshot_json)
  values(p.id,next_version,snap) returning id into release_id;
 update public.portfolios set active_release_id=release_id,status='published',updated_at=now() where id=p.id;
 insert into public.audit_events(portfolio_id,actor_id,event_type) values(p.id,auth.uid(),'publish');
 return next_version;
end;$$;
revoke all on function public.publish_portfolio(uuid) from public,anon;
grant execute on function public.publish_portfolio(uuid) to authenticated;

-- Rate-limited GitHub preview (not a private-repository integration).
create table public.github_import_events (
 id bigint generated always as identity primary key,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index github_import_events_lookup on public.github_import_events(user_id,created_at desc);
alter table public.github_import_events enable row level security;
revoke all on public.github_import_events from anon,authenticated;
create or replace function public.consume_github_import_quota() returns boolean
language plpgsql security definer set search_path = '' as $$
declare last_attempt timestamptz; hourly bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 select max(created_at),count(*) filter(where created_at > now()-interval '1 hour')
  into last_attempt,hourly from public.github_import_events where user_id=auth.uid();
 if (last_attempt is not null and last_attempt > now()-interval '5 seconds') or hourly>=20 then return false; end if;
 insert into public.github_import_events(user_id) values(auth.uid());
 return true;
end;$$;
revoke all on function public.consume_github_import_quota() from public,anon;
grant execute on function public.consume_github_import_quota() to authenticated;

-- Atomic reorder and cover operations avoid partially applied visual content changes.
create or replace function public.reorder_projects(p_portfolio_id uuid,p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
begin
 if not exists(select 1 from public.portfolios where id=p_portfolio_id and owner_id=auth.uid()) then raise exception 'Not authorized' using errcode='42501';end if;
 if coalesce(array_length(p_ids,1),0)>100 or (select count(*) from unnest(p_ids) x)!=(select count(distinct x) from unnest(p_ids) x) then raise exception 'Invalid project order';end if;
 if exists(select 1 from unnest(p_ids) x left join public.projects p on p.id=x and p.portfolio_id=p_portfolio_id where p.id is null) then raise exception 'Unknown project';end if;
 update public.projects p set sort_order=q.ord::integer*10
 from unnest(p_ids) with ordinality q(id,ord) where p.id=q.id and p.portfolio_id=p_portfolio_id;
end;$$;
revoke all on function public.reorder_projects(uuid,uuid[]) from public,anon;
grant execute on function public.reorder_projects(uuid,uuid[]) to authenticated;

create or replace function public.delete_project_category(p_category_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
 select pc.portfolio_id into pid from public.project_categories pc
 join public.portfolios p on p.id=pc.portfolio_id where pc.id=p_category_id and p.owner_id=auth.uid();
 if pid is null then raise exception 'Not authorized' using errcode='42501';end if;
 update public.projects set category_id=null,category='Uncategorized' where category_id=p_category_id and portfolio_id=pid;
 delete from public.project_categories where id=p_category_id and portfolio_id=pid;
end;$$;
revoke all on function public.delete_project_category(uuid) from public,anon;
grant execute on function public.delete_project_category(uuid) to authenticated;

create or replace function public.set_project_cover(p_project_id uuid,p_media_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
 select pr.portfolio_id into pid from public.projects pr join public.portfolios p on p.id=pr.portfolio_id
 where pr.id=p_project_id and p.owner_id=auth.uid();
 if pid is null or not exists(select 1 from public.project_media pm where pm.id=p_media_id and pm.portfolio_id=pid and pm.project_id=p_project_id) then
  raise exception 'Media not found or not authorized' using errcode='42501';end if;
 update public.project_media set is_cover=false where project_id=p_project_id and portfolio_id=pid;
 update public.project_media set is_cover=true where id=p_media_id and project_id=p_project_id and portfolio_id=pid;
end;$$;
revoke all on function public.set_project_cover(uuid,uuid) from public,anon;
grant execute on function public.set_project_cover(uuid,uuid) to authenticated;

create or replace function public.reorder_project_media(p_project_id uuid,p_ids uuid[]) returns void
language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
 select pr.portfolio_id into pid from public.projects pr join public.portfolios p on p.id=pr.portfolio_id
  where pr.id=p_project_id and p.owner_id=auth.uid();
 if pid is null then raise exception 'Not authorized' using errcode='42501';end if;
 if coalesce(array_length(p_ids,1),0)>12 or (select count(*) from unnest(p_ids) x)!=(select count(distinct x) from unnest(p_ids) x) then raise exception 'Invalid media order';end if;
 if exists(select 1 from unnest(p_ids) x left join public.project_media m on m.id=x and m.portfolio_id=pid and m.project_id=p_project_id where m.id is null) then raise exception 'Unknown image';end if;
 update public.project_media m set sort_order=q.ord::integer*10 from unnest(p_ids) with ordinality q(id,ord)
  where m.id=q.id and m.project_id=p_project_id and m.portfolio_id=pid;
end;$$;
revoke all on function public.reorder_project_media(uuid,uuid[]) from public,anon;
grant execute on function public.reorder_project_media(uuid,uuid[]) to authenticated;

commit;
