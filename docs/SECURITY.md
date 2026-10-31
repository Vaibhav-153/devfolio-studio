# Security model — Phase 1

The product serves multiple independent users. All public and private data boundaries must be enforced in the backend, not merely in React.

## Authentication and session

- Supabase Auth handles password hashing, verification, recovery and sessions.
- The Next.js 16 Proxy refreshes Supabase's cookie-based session. Protected pages and server actions call `auth.getClaims()` to verify the JWT. Do not use unverified `getSession().user` for authorization.
- Login cookies must be host-scoped, never globally shared across portfolio subdomains.

## User/tenant isolation

- `portfolios.owner_id` is unique and references `auth.users.id`.
- Owner-scoped SQL policies protect profiles, projects, media records, pages and page drafts.
- Authorized writes use an explicit `owner_id` relationship check at the SQL and server level.
- Storage bucket paths begin with the authenticated user's UUID. File creation policies enforce it.
- A user cannot set or alter publishing status, release pointers, or release JSON through the direct Data API. A database trigger also prevents changing the username once any release exists.

## Public exposure

The `get_public_portfolio(handle)` SQL RPC is the **only** anonymous public data reader. It returns a single immutable active snapshot when `status='published'`. Unpublished portfolios and private drafts are not exposed. The public React renderer checks schema version, block allowlist and URL schemes and never uses `dangerouslySetInnerHTML`.

## Publication transaction

`publish_portfolio(portfolio_id)` validates the caller's ownership and minimum profile data, constructs a snapshot from owned relational data, appends a release number, and activates it in the same database transaction. An error rolls the transaction back. This prevents unauthenticated or cross-tenant publishing.

**Remaining gaps before production:** validate every layout field at the database boundary; ensure publicly served media assets are sanitized and immutable per release; implement rate limits and signup abuse prevention; test cache invalidation; add rollback; test cross-site requests, OAuth and email templates; run Supabase RLS integration tests.

## Manual test matrix

| Attack/test | Expected |
|---|---|
| Account B reads account A projects | Empty results due to RLS |
| Account B updates A project ID | No matching row; no modification |
| Account B calls `save_page_draft` with A page ID | SQL permission error |
| Account B calls `publish_portfolio` for A portfolio | SQL permission error |
| Anonymous reads private drafts | Denied |
| Anonymous calls `get_public_portfolio` for unpublished handle | Null |
| Account owner attempts to update `active_release_id` directly | Denied column privilege |
| Inject `<script>` text into a project summary | Displays literal safe text, not executable HTML |
| Inject `javascript:` URL as a project link | URL removed by renderer validation |
| Insert unsafe block type into layout JSON | Public renderer rejects the snapshot |
| Concurrent editing with stale revision | Save rejected with a conflict error |

**The table describes expected behavior. It is not evidence of a completed integration test.**
