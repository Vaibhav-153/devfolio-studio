# Phase 5 verification evidence and remaining gates

## Verified locally in this package

- 32 Node.js unit tests (Phase 0–5 pure contracts), including routing, validation and media safety.
- Source/SQL contract checks for Phase 1–5.
- Pure TypeScript type checking for the isolated source module subset.
- TypeScript syntax parser for project `.ts`/`.tsx` files.
- Offline Phase 3/Phase 4 browser regression suites and Phase 5 checklist responsive browser tests.
- `scripts/staging-smoke.mjs` refuses to execute without staging-specific explicit opt-in.
- Checklists, CI configuration, readiness route and deployment/operations guidance exist in source.

## Not verified here

- `npm install`, lockfile generation, full TypeScript app build, `npm run lint` or `next build` (npm registry unavailable).
- Execution of SQL migrations 001–004 in Postgres (no project/database credentials supplied).
- Actual cross-tenant isolation in Supabase RLS, Storage or auth sessions.
- Deployment to Vercel, real wildcard DNS, TLS certificates or an actual public portfolio website.
- Production account emails, SMTP settings, browser auth recovery, CAPTCHA, rate limiting at the edge, real load and WCAG audit.
- Enforced Content Security Policy (report-only at this phase), backup restores or third-party monitoring integration.
- Puck editor integration (existing custom React visual editor remains).

## Important changes in Phase 5

- Baseline browser security headers and **report-only** CSP in `next.config.ts`.
- Invalid wildcard children now return 404 rather than silently serving root app routes.
- Auth callback redirects target the configured trusted app URL rather than a request-provided origin.
- Readiness checks the anonymously available public RPC; the underlying portfolio table is owner-only and cannot be read by anonymous clients.
- A dedicated migration adds a 5-release-per-10-minute SQL trigger guard, plus an owner-scoped preflight before public image copying.
- Sanitized error logging, accessible recovery pages, reduced-motion styling, and a skip-to-content control.
- CI checks, an isolated two-account staging smoke script and a read-only deployed HTTP probe.

## Requirements still blocking public beta

1. Generate and commit a reviewed `package-lock.json`, then make all CI build/lint/type checks pass.
2. Apply migrations in a disposable staging Supabase project; run the account-isolation smoke script and manual Storage checks.
3. Configure a root domain/wildcard DNS and test the complete publishing workflow on real HTTPS.
4. Configure production SMTP, abuse controls and monitoring.
5. Run an actual browser accessibility/performance review, test backup restore and resolve any security findings.

Do not describe Phase 5 as a deployed, production-tested service until the above items are complete.
