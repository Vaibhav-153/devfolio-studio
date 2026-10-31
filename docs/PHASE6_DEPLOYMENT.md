# Devfolio Studio - Phase 6 deployment workbook

**State of this package:** staging launch tools and beta-feedback code are prepared. There is **no actual production deployment** in this deliverable. A real deployment requires accounts, project configuration, HTTPS domain routing and real integration tests.

## 0. Decide the environment and budget

- Create two separate Supabase projects: **staging** (disposable) and **production** (customer data). Never run destructive staging scripts on production.
- Use a GitHub repository (initially private) and a Vercel project. Review plan restrictions, wildcard DNS and billing before public use.
- Register your platform domain. This workbook uses `yourdomain.com` as an example: it is *not* an already configured address.
- Set the app on the **root domain** `https://yourdomain.com`; portfolios use `https://handle.yourdomain.com`. This is how the current routing code works. Do not route the dashboard to `app.yourdomain.com` without deliberately changing the host router.
- Prepare a production SMTP sender for account confirmation/reset. Do not enable broad public signup until it is verified.

## 1. Create the source repository

1. Extract the `devfolio-studio-phase6-source.zip` file.
2. Install Node.js **22**. Open a terminal in the extracted folder.
3. Run `npm install` to generate a real `package-lock.json` from the registry. Review dependency versions; **no lockfile is fabricated or provided in this package**.
4. Run `npm ci`, `npm run verify:phase6`, `npm run lint`, `npm run typecheck` and `npm run build`. Fix all failing checks before a staging deployment.
5. Initialize Git, review staged files, and commit. Confirm `.env.local` and other secrets are ignored.
6. Push into a private GitHub repository. Ensure the CI workflow runs on pull requests. Protect the main branch once checks pass.

```bash
npm install
npm ci
npm run verify:phase6
npm run lint
npm run typecheck
npm run build
```

## 2. Prepare the staging database

1. In Supabase create a **new staging** project with no real customers or production data.
2. Prefer the official Supabase CLI: `npx supabase login`, `npx supabase link --project-ref YOUR_STAGING_PROJECT_REF`, then `npx supabase db push`. The CLI uses migrations under `supabase/migrations/`.
3. Confirm these **five files** applied in numeric order:
   - `202610310001_initial.sql`
   - `202610310002_content_management.sql`
   - `202610310003_publishing.sql`
   - `202610310004_production_hardening.sql`
   - `202610310005_beta_feedback.sql`
4. In Supabase, check Auth email verification, Site URL, allowed redirect URLs (including `https://yourdomain.com/auth/callback`), SMTP and rate limits.
5. Review RLS policies for user-owned tables, private file storage, and publication RPC security in the Dashboard.

Do not paste Supabase service-role secrets, passwords or connection strings into this chat or source code.

## 3. Configure Vercel

1. Import your GitHub repository into a Vercel project.
2. Set the environment variables in Vercel for the target environment:

| Variable | Visibility | Example / explanation |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | URL from the correct Supabase project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | Publishable/anon API key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only secret** | Service role from Supabase; never use NEXT_PUBLIC prefix |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Browser-safe | `yourdomain.com`, no protocol |
| `NEXT_PUBLIC_APP_URL` | Browser-safe | `https://yourdomain.com` |

3. Deploy to a **staging** hostname first. Set domain and Auth callback values to the exact staging address for that environment. The preflight script expects the application URL hostname and root domain to match.
4. Set `https://yourdomain.com` as the root website, and wildcard `*.yourdomain.com` on Vercel with the required nameserver/DNS configuration. Check TLS certificates actually issue. Use a separate test domain for staging if needed.
5. Do not connect or expose test/staging Supabase data to your production deployment.

## 4. Preflight and integration gates

Run preflight in the same environment (with its private shell variables set):

```bash
npm run preflight:staging
# Preflight is a static configuration check, NOT proof of deployment.
```

On **disposable staging only**, run the account isolation smoke script:

```bash
DEVFOLIO_TEST_ENV=staging STAGING_TEST_CONFIRM=CREATE_AND_DELETE_TEST_USERS \
STAGING_SUPABASE_PROJECT_REF=YOUR_STAGING_PROJECT_REF \
node scripts/staging-smoke.mjs
```

The script creates two temporary test users and attempts cleanup. The required project ref must exactly match the `<project-ref>.supabase.co` endpoint. Inspect warnings and remove leftover accounts manually. It also tests the Phase 6 feedback RLS rules. Never run it on production.

After deploying to staging, run safe anonymous HTTP checks:

```bash
DEVFOLIO_PROBE_URL=https://your-staging-domain.com/ \
node scripts/release-smoke.mjs
```

For wildcard and case-study checks, also set `DEVFOLIO_ROOT_DOMAIN`, `DEVFOLIO_PUBLIC_HANDLE`, and optionally `DEVFOLIO_PROJECT_SLUG`. This checks public HTTP behavior only and **does not replace the two-user RLS smoke**. The `deployed-smoke.yml` GitHub workflow offers a manual read-only run.

## 5. Manual browser checks before beta

- Sign up, confirm email, log out and log back in, and use password recovery.
- Test two separate accounts and attempt cross-account access to projects, drafts, images and feedback.
- Upload screenshots, build a project, choose a template, edit desktop and mobile designs and save drafts.
- Publish and visit the real HTTPS subdomain; confirm project details and cover images are correct.
- Make draft edits and check the live site does not change until republishing.
- Restore an older release, verify the new version and the history, then unpublish and confirm public 404 behavior.
- Test navigation and keyboard access; inspect layouts at 320, 390, 768, 1024 and 1440px.
- Verify production email, security headers, image cache behavior and accessible error handling.
- Confirm backups exist and actually rehearse restoring **staging**.
- Configure monitoring/error alerts and an incident contact. Treat account deletion and data retention as an operational requirement.

## 6. Invite-only beta

Invite a few developers with different backgrounds and ask each to build a real portfolio without your help. Capture onboarding friction, time to first preview and publication, mobile usability, project import quality, error reports and recovery. The authenticated dashboard contains **Beta feedback**; reports are user-owned in the `beta_feedback` table. A platform operator reviews reports through Supabase until a dedicated admin console is implemented.

See `docs/BETA_TEST_PLAN.md` and `docs/PHASE6_STATUS.md` for go/no-go criteria. Do not announce launch until all mandatory gates pass.
