-- Devfolio Studio Phase 5. Apply after 001, 002, 003 in a fresh STAGING project.
-- Restrict publication bursts even if a client bypasses the Next.js server action.
begin;

create index if not exists published_releases_recent_idx
  on public.published_releases(portfolio_id,created_at desc);

-- A read-only owner-scoped preflight to avoid copying public images when the
-- release quota has already been exhausted. The insert trigger below is the
-- final authority, preventing direct RPC clients from circumventing the limit.
create or replace function public.check_release_quota(p_portfolio_id uuid)
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(
   select 1 from public.portfolios p where p.id=p_portfolio_id and p.owner_id=auth.uid()
 ) then raise exception 'Not authorized' using errcode='42501';end if;
 return (select count(*) from public.published_releases r
   where r.portfolio_id=p_portfolio_id and r.created_at > now()-interval '10 minutes') < 5;
end;$$;
revoke all on function public.check_release_quota(uuid) from public,anon;
grant execute on function public.check_release_quota(uuid) to authenticated;

-- The database transaction creates a new published release only after this
-- trigger succeeds. Locking the portfolio makes parallel requests serial.
create or replace function public.enforce_release_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(
   select 1 from public.portfolios p where p.id=new.portfolio_id and p.owner_id=auth.uid()
 ) then raise exception 'Not authorized' using errcode='42501';end if;
 perform pg_advisory_xact_lock(20261031,hashtext(new.portfolio_id::text));
 if (select count(*) from public.published_releases r
       where r.portfolio_id=new.portfolio_id and r.created_at > now()-interval '10 minutes') >= 5 then
   raise exception 'Publishing limit reached. Try again later.' using errcode='22023';
 end if;
 return new;
end;$$;
revoke all on function public.enforce_release_quota() from public,anon,authenticated;
drop trigger if exists devfolio_release_quota on public.published_releases;
create trigger devfolio_release_quota before insert on public.published_releases
 for each row execute function public.enforce_release_quota();

-- Audit events and release snapshots remain owner-read-only; all snapshot
-- mutations continue through security-definer publication RPCs.
commit;
