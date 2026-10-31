-- Devfolio Studio Phase 6: account-owned private beta feedback.
-- The platform administrator can review submissions through the Supabase dashboard.
-- This migration does not grant cross-user access to reports.
begin;
create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check(kind in ('bug','usability','idea')),
  severity text not null default 'normal' check(severity in ('low','normal','blocking')),
  title text not null check(char_length(title) between 5 and 120),
  description text not null check(char_length(description) between 20 and 3000),
  page_path text not null default '/dashboard' check(char_length(page_path)<=160 and left(page_path,1)='/' and left(page_path,2)<>'//'),
  status text not null default 'new' check(status in ('new','reviewing','resolved')),
  created_at timestamptz not null default now()
);
create index if not exists beta_feedback_owner_date_idx on public.beta_feedback(reporter_id,created_at desc);
alter table public.beta_feedback enable row level security;
revoke all on public.beta_feedback from public,anon,authenticated;
grant select on public.beta_feedback to authenticated;
grant insert(portfolio_id,reporter_id,kind,severity,title,description,page_path) on public.beta_feedback to authenticated;
create policy feedback_owner_select on public.beta_feedback for select to authenticated
 using (reporter_id=(select auth.uid()) and exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));
create policy feedback_owner_insert on public.beta_feedback for insert to authenticated
 with check (reporter_id=(select auth.uid()) and exists(select 1 from public.portfolios p where p.id=portfolio_id and p.owner_id=(select auth.uid())));

-- Prevent bulk automated feedback spam. The lock serializes concurrent submissions.
create or replace function public.limit_beta_feedback() returns trigger
 language plpgsql security definer set search_path = '' as $$
begin
 if new.reporter_id<>auth.uid() or not exists(select 1 from public.portfolios p where p.id=new.portfolio_id and p.owner_id=auth.uid()) then
   raise exception 'Not authorized' using errcode='42501';
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(new.reporter_id::text)::bigint);
 if (select count(*) from public.beta_feedback f where f.reporter_id=new.reporter_id and f.created_at > now()-interval '1 hour') >= 5 then
   raise exception 'Feedback rate limit exceeded' using errcode='P0001';
 end if;
 return new;
end;$$;
revoke all on function public.limit_beta_feedback() from public,anon,authenticated;
create trigger devfolio_limit_beta_feedback before insert on public.beta_feedback
 for each row execute function public.limit_beta_feedback();
commit;
