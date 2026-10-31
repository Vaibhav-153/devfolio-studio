-- Devfolio Studio Phase 1 — apply in a NEW Supabase project.
-- Data ownership is enforced in Postgres and not merely through UI checks.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name)<=100),
  created_at timestamptz not null default now()
);

create table if not exists public.portfolios (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users(id) on delete cascade,
  handle text unique,
  template text not null default 'minimal' check (template in ('minimal','midnight','grid')),
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  active_release_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint valid_portfolio_handle check (
    handle is null or (
      handle ~ '^[a-z][a-z0-9-]{2,29}$' and right(handle,1)<>'-' and
      handle not in ('www','app','api','admin','dashboard','login','signup','studio','p','sites','static','assets','mail','support','help','dev','test','localhost','demo')
    )
  )
);
create index if not exists portfolios_owner_idx on public.portfolios(owner_id);

-- The initial public username is permanent after the first release, even after unpublishing.
-- This check runs for direct Data API updates as well as our server-side form.
create or replace function public.protect_published_handle() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.active_release_id is not null and new.handle is distinct from old.handle then
    raise exception 'Published handles are permanent in Release 1' using errcode='22023';
  end if;
  return new;
end;$$;
create trigger devfolio_lock_handle before update of handle on public.portfolios
for each row execute function public.protect_published_handle();

create table if not exists public.portfolio_profiles (
  portfolio_id uuid primary key references public.portfolios(id) on delete cascade,
  name text not null default '' check (char_length(name)<=100),
  role text not null default '' check (char_length(role)<=120),
  hero_one text not null default '' check (char_length(hero_one)<=130),
  hero_two text not null default '' check (char_length(hero_two)<=130),
  intro text not null default '' check (char_length(intro)<=1000),
  about text not null default '' check (char_length(about)<=2500),
  email text not null default '' check (char_length(email)<=254),
  github text not null default '' check (char_length(github)<=2048),
  linkedin text not null default '' check (char_length(linkedin)<=2048),
  skills text[] not null default '{}'::text[]
);

create table if not exists public.portfolio_pages (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  page_key text not null check(page_key ~ '^[a-z][a-z0-9-]*$'),
  title text not null check(char_length(title)<=80),
  path text not null,
  sort_order int not null default 0,
  unique(portfolio_id, page_key)
);
create index if not exists portfolio_pages_portfolio_idx on public.portfolio_pages(portfolio_id);

create table if not exists public.page_drafts (
  page_id uuid primary key references public.portfolio_pages(id) on delete cascade,
  layout_json jsonb not null default '{"schemaVersion":1,"blocks":[]}'::jsonb
    check(jsonb_typeof(layout_json)='object' and (layout_json->>'schemaVersion')='1' and jsonb_typeof(layout_json->'blocks')='array' and pg_column_size(layout_json)<=600000),
  revision int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  title text not null check(char_length(title) between 1 and 120),
  slug text not null check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug)<=100),
  category text not null default 'Development' check(char_length(category)<=60),
  summary text not null default '' check(char_length(summary)<=1800),
  tech text[] not null default '{}'::text[],
  github text not null default '' check(char_length(github)<=2048),
  demo text not null default '' check(char_length(demo)<=2048),
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(portfolio_id,slug)
);
create index if not exists projects_portfolio_idx on public.projects(portfolio_id,sort_order);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists media_assets_owner_idx on public.media_assets(owner_id);

create table if not exists public.published_releases (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  version int not null,
  snapshot_json jsonb not null,
  created_at timestamptz not null default now(),
  unique(portfolio_id,version)
);
create index if not exists published_releases_portfolio_idx on public.published_releases(portfolio_id);
alter table public.portfolios add constraint active_release_fk foreign key(active_release_id) references public.published_releases(id) on delete set null;

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  portfolio_id uuid references public.portfolios(id) on delete set null,
  actor_id uuid,
  event_type text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS on ALL user-controlled tables, including the release and audit tables.
alter table public.profiles enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_profiles enable row level security;
alter table public.portfolio_pages enable row level security;
alter table public.page_drafts enable row level security;
alter table public.projects enable row level security;
alter table public.media_assets enable row level security;
alter table public.published_releases enable row level security;
alter table public.audit_events enable row level security;

-- Explicit grants: the browser may not set publishing status, owner ID or active release pointer.
revoke all on public.profiles,public.portfolios,public.portfolio_profiles,public.portfolio_pages,public.page_drafts,public.projects,public.media_assets,public.published_releases,public.audit_events from anon, authenticated;
grant select,insert,update(display_name),delete on public.profiles to authenticated;
grant select,update(handle,template) on public.portfolios to authenticated;
grant select,update on public.portfolio_profiles to authenticated;
grant select on public.portfolio_pages to authenticated;
grant select,insert,update,delete on public.projects,public.media_assets to authenticated;
grant select on public.page_drafts,public.published_releases to authenticated;

create policy profiles_owner_select on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy profiles_owner_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy profiles_owner_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy profiles_owner_delete on public.profiles for delete to authenticated using(id=(select auth.uid()));

create policy portfolios_owner_select on public.portfolios for select to authenticated using(owner_id=(select auth.uid()));
create policy portfolios_owner_update on public.portfolios for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));

create policy portfolio_profiles_owner_select on public.portfolio_profiles for select to authenticated using(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));
create policy portfolio_profiles_owner_update on public.portfolio_profiles for update to authenticated using(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid()))) with check(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));

create policy pages_owner_select on public.portfolio_pages for select to authenticated using(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));

create policy drafts_owner_select on public.page_drafts for select to authenticated using(exists(select 1 from public.portfolio_pages pg join public.portfolios p on p.id=pg.portfolio_id where pg.id=page_id and p.owner_id=(select auth.uid())));

create policy projects_owner_select on public.projects for select to authenticated using(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));
create policy projects_owner_insert on public.projects for insert to authenticated with check(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));
create policy projects_owner_update on public.projects for update to authenticated using(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid()))) with check(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));
create policy projects_owner_delete on public.projects for delete to authenticated using(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));

create policy assets_owner_select on public.media_assets for select to authenticated using(owner_id=(select auth.uid()) and exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));
create policy assets_owner_insert on public.media_assets for insert to authenticated with check(owner_id=(select auth.uid()) and split_part(storage_path,'/',1)=(select auth.uid())::text and exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));
create policy assets_owner_update on public.media_assets for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()) and split_part(storage_path,'/',1)=(select auth.uid())::text and exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));
create policy assets_owner_delete on public.media_assets for delete to authenticated using(owner_id=(select auth.uid()));
create policy releases_owner_select on public.published_releases for select to authenticated using(exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));
-- No authenticated or anonymous policy allows modifying release rows directly.
-- Audit events are written by privileged server-side functions only.

-- Seed private portfolio when a user signs up. Uses search_path hardening.
create or replace function public.initialize_user_portfolio() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pid uuid; homeid uuid; projectsid uuid;
begin
  insert into public.profiles(id,display_name) values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),100)) on conflict (id) do nothing;
  insert into public.portfolios(owner_id) values(new.id) on conflict(owner_id) do update set owner_id=excluded.owner_id returning id into pid;
  insert into public.portfolio_profiles(portfolio_id,name,role,hero_one,hero_two,intro,about)
    values(pid,left(coalesce(new.raw_user_meta_data->>'display_name',''),100),'Developer','Building thoughtful','digital experiences.','Welcome to your portfolio. Add a short introduction here.','Tell your story and describe what you love building.') on conflict(portfolio_id) do nothing;
  insert into public.portfolio_pages(portfolio_id,page_key,title,path,sort_order) values(pid,'home','Home','/',0) on conflict(portfolio_id,page_key) do update set title=excluded.title returning id into homeid;
  insert into public.portfolio_pages(portfolio_id,page_key,title,path,sort_order) values(pid,'projects','Projects','/projects',1) on conflict(portfolio_id,page_key) do update set title=excluded.title returning id into projectsid;
  insert into public.page_drafts(page_id,layout_json) values(homeid,'{"schemaVersion":1,"blocks":[{"id":"hero","type":"Hero","props":{},"style":{"surface":"plain","paddingY":70}},{"id":"work","type":"ProjectGrid","props":{"title":"Selected work","maxProjects":6,"columns":2},"style":{"surface":"soft","paddingY":56}},{"id":"about","type":"About","props":{},"style":{"surface":"plain","paddingY":56}},{"id":"skills","type":"Skills","props":{},"style":{"surface":"soft","paddingY":56}},{"id":"contact","type":"Contact","props":{},"style":{"surface":"plain","paddingY":56}}]}'::jsonb) on conflict(page_id) do nothing;
  insert into public.page_drafts(page_id,layout_json) values(projectsid,'{"schemaVersion":1,"blocks":[{"id":"work-hero","type":"Text","props":{"eyebrow":"Projects","title":"What I have built","body":"A selection of my work and experiments."},"style":{"surface":"plain","paddingY":70}},{"id":"work-grid","type":"ProjectGrid","props":{"title":"Projects","maxProjects":24,"columns":2},"style":{"surface":"soft","paddingY":56}}]}'::jsonb) on conflict(page_id) do nothing;
  return new;
end;$$;
drop trigger if exists devfolio_on_signup on auth.users;
create trigger devfolio_on_signup after insert on auth.users for each row execute function public.initialize_user_portfolio();
revoke all on function public.initialize_user_portfolio() from public,anon,authenticated;

-- Optimistic locking prevents silent lost updates when drafts are opened in multiple tabs.
create or replace function public.save_page_draft(p_page_id uuid,p_layout jsonb,p_expected_revision integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare new_revision integer;
begin
 if not exists(select 1 from public.portfolio_pages pg join public.portfolios p on p.id=pg.portfolio_id where pg.id=p_page_id and p.owner_id=auth.uid()) then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_expected_revision<0 or jsonb_typeof(p_layout)<>'object' or p_layout->>'schemaVersion'<>'1' or jsonb_typeof(p_layout->'blocks')<>'array' or jsonb_array_length(p_layout->'blocks')>60 or pg_column_size(p_layout)>600000 then raise exception 'Invalid layout' using errcode='22023'; end if;
 update public.page_drafts set layout_json=p_layout,revision=revision+1,updated_at=now() where page_id=p_page_id and revision=p_expected_revision returning revision into new_revision;
 if new_revision is null then raise exception 'Draft changed in another tab. Reload before editing.' using errcode='40001';end if;
 return new_revision;
end;$$;
revoke all on function public.save_page_draft(uuid,jsonb,integer) from public,anon;
grant execute on function public.save_page_draft(uuid,jsonb,integer) to authenticated;

-- Release snapshot is BUILT by Postgres from the user's own rows. No client-provided snapshot is trusted.
create or replace function public.publish_portfolio(p_portfolio_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare p public.portfolios%rowtype; person public.portfolio_profiles%rowtype;
  next_version int; release_id uuid; snap jsonb;
begin
 select * into p from public.portfolios where id=p_portfolio_id and owner_id=auth.uid() for update;
 if not found then raise exception 'Not authorized' using errcode='42501';end if;
 select * into person from public.portfolio_profiles where portfolio_id=p.id;
 if p.handle is null or person.name='' or person.role='' then raise exception 'A username, name and role are required to publish' using errcode='22023';end if;
 if not exists(select 1 from public.projects where portfolio_id=p.id) then raise exception 'Add at least one project before publishing' using errcode='22023';end if;
 select coalesce(max(version),0)+1 into next_version from public.published_releases where portfolio_id=p.id;
 select jsonb_build_object(
   'schemaVersion',1,'template',p.template,
   'site',jsonb_build_object('name',person.name,'role',person.role,'heroOne',person.hero_one,'heroTwo',person.hero_two,'intro',person.intro,'about',person.about,'email',person.email,'github',person.github,'linkedin',person.linkedin,'skills',to_jsonb(person.skills)),
   'projects',coalesce((select jsonb_agg(jsonb_build_object('id',pr.id,'title',pr.title,'slug',pr.slug,'category',pr.category,'summary',pr.summary,'tech',to_jsonb(pr.tech),'github',pr.github,'demo',pr.demo) order by pr.sort_order,pr.created_at) from public.projects pr where pr.portfolio_id=p.id),'[]'::jsonb),
   'pages',coalesce((select jsonb_agg(jsonb_build_object('key',pg.page_key,'title',pg.title,'layout',d.layout_json) order by pg.sort_order) from public.portfolio_pages pg join public.page_drafts d on d.page_id=pg.id where pg.portfolio_id=p.id),'[]'::jsonb)
 ) into snap;
 insert into public.published_releases(portfolio_id,version,snapshot_json) values(p.id,next_version,snap) returning id into release_id;
 update public.portfolios set active_release_id=release_id,status='published',updated_at=now() where id=p.id;
 insert into public.audit_events(portfolio_id,actor_id,event_type) values(p.id,auth.uid(),'publish');
 return next_version;
end;$$;
revoke all on function public.publish_portfolio(uuid) from public,anon;
grant execute on function public.publish_portfolio(uuid) to authenticated;

create or replace function public.unpublish_portfolio(p_portfolio_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
 update public.portfolios set status='unpublished',updated_at=now() where id=p_portfolio_id and owner_id=auth.uid();
 if not found then raise exception 'Not authorized' using errcode='42501';end if;
 insert into public.audit_events(portfolio_id,actor_id,event_type) values(p_portfolio_id,auth.uid(),'unpublish');
end;$$;
revoke all on function public.unpublish_portfolio(uuid) from public,anon;
grant execute on function public.unpublish_portfolio(uuid) to authenticated;

-- Anonymous access is ONLY possible through this narrow function, never to drafts or underlying tables.
create or replace function public.get_public_portfolio(p_handle text) returns jsonb
language sql stable security definer set search_path = '' as $$
 select r.snapshot_json from public.portfolios p join public.published_releases r on r.id=p.active_release_id and r.portfolio_id=p.id
 where p.handle=lower(p_handle) and p.status='published' limit 1;
$$;
revoke all on function public.get_public_portfolio(text) from public;
grant execute on function public.get_public_portfolio(text) to anon,authenticated;

-- Private, owner-scoped upload bucket. Published media promotion comes in the media phase.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('portfolio-drafts','portfolio-drafts',false,5242880,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do nothing;
create policy private_media_select on storage.objects for select to authenticated using(bucket_id='portfolio-drafts' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy private_media_insert on storage.objects for insert to authenticated with check(bucket_id='portfolio-drafts' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy private_media_update on storage.objects for update to authenticated using(bucket_id='portfolio-drafts' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='portfolio-drafts' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy private_media_delete on storage.objects for delete to authenticated using(bucket_id='portfolio-drafts' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
