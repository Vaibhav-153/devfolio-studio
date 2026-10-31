# Phase 4 — Deployment and Domain Configuration

This guide describes the setup needed to validate Devfolio Studio on staging. It is **not** a claim that the project is currently deployed. You must own the external accounts and configure them yourself. Never send passwords, API tokens or service-role keys through chat.

## Prerequisites

- Node.js 22 (compatible with the application's Next.js requirement), npm and a GitHub repository you control.
- A Supabase project with Auth, Postgres and Storage enabled.
- A Vercel project with appropriate multi-tenant domain entitlements for your usage.
- An owned domain, for example `example-builder.com`, if you want wildcard subdomains in production.
- A transactional email provider for real auth confirmation and password reset emails.

## 1 — Install the application

```bash
npm install
npm run typecheck
npm run build
```

This package doesn't include a lockfile because the npm registry was unavailable during its construction. Generate and commit a reviewed `package-lock.json` after dependency installation, then change CI to use `npm ci`. Do not launch a public beta until the actual build succeeds.

## 2 — Set up Supabase

In a **new staging project**, apply the SQL migrations in numeric order. Do not apply Phase 4 before Phase 2.

- `202610310001_initial.sql` — owner-scoped portfolio, draft and release tables, initial RPCs.
- `202610310002_content_management.sql` — projects, galleries, skills, career content, private uploads, content snapshot.
- `202610310003_publishing.sql` — public bucket, new owner-authorized publisher, image verification, rollback and revocation of legacy publish RPC.

Enable email verification and configure approved redirect URLs for local, staging and production app addresses. Test a second user account to validate row-level ownership.

### Required environment variables

| Name | Used for | Visibility |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase public project URL | Browser and server |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable or anon key | Browser and server |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side immutable image publication | **Server only** |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Parent domain for user portfolios | Public configuration |
| `NEXT_PUBLIC_APP_URL` | Auth callback/application URL | Public configuration |

In staging, set these values in Vercel's environment settings. Never put the service key into `NEXT_PUBLIC_*`, client code, screenshots, browser storage, or a repository.

## 3 — Set up the hosting domain

Point the parent domain and wildcard subdomain to the Vercel project using the current Vercel domain instructions. Wildcard certificates may require the appropriate nameserver setup and eligible Vercel plan. In local development, you can always test `/p/alex` without wildcard DNS. For production, `NEXT_PUBLIC_ROOT_DOMAIN` must be the actual parent hostname **without** `https://` or a trailing slash.

The platform marketing site and dashboard run at the root domain. Tenant hostnames are rewritten by `proxy.ts` to `/p/<handle>`, and owner-only endpoints are blocked from tenant hosts. Public pages are resolved only from active published snapshots.

## 4 — Verify real publication with two accounts

1. Register User A and User B, with confirmed emails. Both should have separate portfolio records.
2. User A adds a valid profile, one visible project and a valid PNG/JPEG/WebP gallery image.
3. User A reserves a unique handle and opens private `/preview/home`.
4. User A opens `/dashboard/publishing` and publishes. Check the audit log and version 1 record.
5. Verify that A's image URL uses the `portfolio-public` bucket and continues to load after its draft upload has changed.
6. Check the live `https://<handle>.<root>` homepage and `/projects/<slug>` case study.
7. Change A's draft but don't publish. Verify the public site still renders version 1.
8. Publish again. Verify version 2 is active; verify version 1 remains available in the owner's release history.
9. Restore version 1. Verify a NEW version 3 becomes active and the old records remain immutable.
10. Unpublish. Verify the public HTML 404s while owner access, drafts and historical releases remain.
11. As User B, attempt to read/modify A's draft, files, release history, or invoke restore with A's release ID. Every attempt must be denied.
12. Verify public sitemap, robots, canonical metadata, mobile layout and accessibility of the published portfolio.

No step is considered complete until its behavior is observed against a real staging database and deployed host.

## 5 — Media lifecycle and operations

The publishing action downloads private images through a server-only credential, verifies image signatures, and copies the bytes to a unique path: `<portfolio-uuid>/<batch-uuid>/<asset-uuid>.<extension>`. It then calls the database RPC. The database checks all currently referenced image paths exist before activation. If it fails, the active release remains unchanged.

**Do not blindly delete public paths from a failed request.** The database transaction may have succeeded when a network response failed. To clean storage, first compare paths against every retained published snapshot and confirm no active or historical release refers to them. Set a retention policy only after staging tests and backup validation.

The initial workflow is synchronous and caps public images at 24. On production workloads with larger files, replace it with a retryable background publication job before increasing the cap.

## 6 — Production readiness gates

- Full `npm install`, `npm run typecheck`, `npm run build` success.
- Real SQL migrations and RLS integration tests in staging.
- Cross-tenant and public-anon storage tests.
- Wildcard domain, DNS, HTTPS and release URLs verified.
- Auth email, session isolation, rate limiting and password reset verified.
- Content Security Policy, file scanning, abuse reporting and monitoring reviewed.
- Database backup and restore procedure rehearsed.
- Published mobile performance and WCAG accessibility review.

Read `docs/PHASE4_VERIFICATION.md` for the precise local-only test report and remaining gaps.
