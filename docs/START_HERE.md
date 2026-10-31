# Start here - Devfolio Studio Phase 6

1. Open `preview-phase6/index.html` to explore the self-contained launch console. This is a local checklist, **not a deployed website**.
2. Read `docs/PHASE6_DEPLOYMENT.md` and `docs/PHASE6_STATUS.md` for configuration and blockers.
3. Use `npm run test:phase6` for dependency-light checks. To build the real Next.js app, first install Node 22 and run `npm install`, which generates a real dependency lockfile.
4. Set up GitHub, a disposable Supabase staging project, Vercel and a staging domain. Keep passwords and server secrets out of source code and chat.
5. Apply migrations through `202610310005_beta_feedback.sql`, then follow the guarded staging test and read-only hosted probe.
6. Test a real account and public wildcard domain before inviting beta testers.

See `docs/BETA_TEST_PLAN.md` for moderated developer feedback sessions and `docs/PHASE6_TEST_RESULTS.md` for accurate local verification evidence.

---

# Start Here — Phase 4

1. Open `preview-phase4/index.html` to try the publishing and release history user experience without any setup. The actions are local-only.
2. Review `README.md` for the source code and supported features.
3. Review `docs/DEPLOYMENT_PHASE4.md` for the exact external setup: Node.js, Supabase, database migrations, hosting, wildcard DNS and service-only credentials.
4. Review `docs/PHASE4_VERIFICATION.md` for what has and has not been tested.
5. In a real staging environment, configure `.env.local` (do not share secret values) and apply the three SQL migrations in order. Run the complete Next.js build and multi-user tests before any public launch.
