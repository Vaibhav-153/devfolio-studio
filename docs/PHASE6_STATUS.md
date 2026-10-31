# Phase 6 evidence and launch status

**Status:** Source package and local checks prepared. **Not deployed. No live beta launched.**

## Completed in this environment

- Extended Phase 5 project with Phase 6 private beta-feedback module and migration `202610310005_beta_feedback.sql`.
- Added static release preflight with explicit warning that static checks do not establish deployment.
- Added read-only staging smoke checks, optional tenant and case-study checks, and a manual GitHub Actions workflow.
- Extended two-account staging test code to include beta-feedback RLS ownership assertions and a matching staging-project-ref guard.
- Added launch workbook, structured tester protocol, feedback issue template, and offline launch console.
- Ran available source-contract, pure Node.js unit and local browser tests; see `docs/PHASE6_TEST_RESULTS.md`.

## Not completed here

- GitHub repository or Vercel/Supabase connections: must be authorized by the user.
- `npm install`, `package-lock.json`, `next build`, full Next.js `tsc` and ESLint: package registry DNS failed (`EAI_AGAIN`).
- SQL migrations executed in hosted Supabase, real two-account RLS / storage tests.
- Actual published portfolio subdomains, DNS, TLS and live website reachability.
- Configured SMTP, real invite-only users, backups, monitoring or provider billing.
- The earlier Puck research decision has not been replaced by a verified Puck integration; existing custom React editor remains.

## Minimum launch blockers
1. Create and connect the user-controlled GitHub, Supabase and Vercel projects, configure domain and SMTP.
2. Generate a genuine `package-lock.json`, then make CI (`lint`, `typecheck`, `verify:phase6`, `build`) pass.
3. Apply migrations and pass two-account isolation tests in disposable staging.
4. Verify wildcard HTTPS publishing, drafts, rollback, unpublishing, and image safety end to end.
5. Test backup restoration, alerts and abuse-response controls before a public beta.

**No claims of successful deployment or production testing should be made until those gates are checked.**
