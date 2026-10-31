# Phase 5 staging and go-live procedure

**Status: not deployed; source hardening and local tests only.** This procedure must be carried out in services you control. Do not provide account passwords, database service-role keys, or other secrets in chat.

## Gate 0 — Create accounts and review costs

You need GitHub, Supabase, Vercel, and a domain you control for production wildcard hostnames. Use a **separate staging Supabase project** so test accounts and destructive QA operations never affect real users. A transactional SMTP provider is necessary for reliable signup, confirmation, recovery and production email limits. Verify the allowed hosting plan, billing, DNS setup and wildcard TLS entitlements directly with the providers.

## Gate 1 — Reproducible build

1. Install Node.js 22. On your computer, extract the project and run `npm install`.
2. **Commit the generated and reviewed `package-lock.json`.** The package provided here cannot include a verified lockfile because the registry was unreachable in the authoring environment. Do not fabricate one.
3. Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run verify:all`, and `npm run build`. All must succeed before release.
4. Inspect any `npm audit` reports and update vulnerable dependencies after reviewing compatibility.
5. Push to a private GitHub repository at first. `.github/workflows/ci.yml` is a required merge gate and intentionally fails if the lockfile is absent.

## Gate 2 — Staging database and accounts

1. Create a disposable Supabase **staging** project and configure email verification and SMTP.
2. Apply the migrations in order: `202610310001_initial.sql`, `202610310002_content_management.sql`, `202610310003_publishing.sql`, `202610310004_production_hardening.sql`.
3. Review Supabase Security Advisor, RLS policies, Auth settings, Storage policies, organization MFA, and database connection restrictions.
4. Supply the required variables via your private shell or GitHub's **staging** environment secrets (never via public code):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_ROOT_DOMAIN`
   - `NEXT_PUBLIC_APP_URL`
5. Run the destructive staging smoke script only when the project is known to be disposable:

```bash
DEVFOLIO_TEST_ENV=staging \
STAGING_TEST_CONFIRM=CREATE_AND_DELETE_TEST_USERS \
node scripts/staging-smoke.mjs
```

The command also requires the environment variables above. It creates two synthetic accounts, tests their permissions, publishes/unpublishes a disposable portfolio, restores a version and attempts to delete the test accounts in a `finally` block. Check for cleanup warnings and manually remove leftovers. **Never run this against production.**

## Gate 3 — Vercel staging

1. Import the GitHub repository into a Vercel project. Configure environment variables per environment. The service-role key must remain server-only.
2. Configure the root domain for the app, plus a wildcard `*.your-domain.com` via the provider's current instructions. Wildcard HTTPS may require Vercel nameservers and an eligible plan.
3. Configure Supabase auth callback and recovery allowlists with your exact app URL (`https://your-domain.com/auth/callback`) and local URLs used for development.
4. Deploy, then run:

```bash
DEVFOLIO_PROBE_URL=https://your-staging-domain.com node scripts/production-probe.mjs
```

The probe checks the landing page, liveness, readiness and security headers. It does not test security isolation or real publications.

## Gate 4 — Real browser validation

- Test registration, email confirmation, login, password reset and sign-out on desktop/mobile.
- With two real staging accounts, verify every private record and file is inaccessible across tenants.
- Add project images, publish, open project case studies, edit a draft without publishing, republish, restore, then unpublish. Verify public 404s and historical snapshot integrity.
- Verify `https://user.your-domain.com` matches the associated portfolio, and that malformed or reserved subdomains do not expose the root dashboard.
- Confirm HTTP headers and Content Security Policy violations in real browsers. Phase 5 **only enables CSP Report-Only**; enforce an appropriate CSP after compatibility testing.
- Run a responsive and accessibility review at 320px, 390px, 768px and desktop widths, including keyboard access and reduced-motion settings.
- Measure public portfolio performance on actual devices and realistic project-image loads.

## Gate 5 — Operational readiness

- Verify database backups and **perform a restore rehearsal** in staging, not only a backup setting check.
- Configure error alerting and a documented on-call recipient. The app emits sanitized JSON error events and a readiness endpoint; it is not connected to an external monitoring vendor.
- Configure upstream WAF, bot protection, signup/email rate limits and anonymous public-read throttling. Database release inserts are limited to 5 per 10 minutes; this is not a replacement for public WAF protection.
- Monitor asset usage and published image retention. Do not delete public media without verifying references from all historical releases.
- Document incident response, abuse reporting, account deletion, data export, and data retention before accepting broad public usage.
- Roll out first to a small invite-only beta. Remove staging users and test assets from production.

## Go/no-go rule

**No public beta** until the production build succeeds, real tenant-isolation tests pass, a complete publish/restore/unpublish cycle succeeds on real hosting, and basic incident/backup operations have been rehearsed.

References: Next.js 16 Proxy and Backend-for-Frontend guidance; Supabase production security checklist; Vercel single-codebase multi-tenant and wildcard domain documentation. See the separate `docs/PHASE5_VERIFICATION.md` for evidence and gaps.
