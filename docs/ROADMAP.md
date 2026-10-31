# Devfolio Studio roadmap - current phase

- Phases 1-5: application, content dashboard, custom visual editor, source-level publishing workflow, production-readiness controls.
- **Phase 6 (current):** staging launch kit, private beta feedback, read-only hosted probes, guided deployment/testing documents. Local tests pass; service integration remains **pending**.
- **Required next user actions:** connect GitHub, Supabase, Vercel, configure a domain and transactional email; generate reviewed dependency lockfile, run complete production build, execute migrations and live security checks.
- Only after real-hosting acceptance: invite-only developer beta; fix blockers; complete backup/restore/monitoring and privacy review; then decide on public launch.

Note: This codebase currently uses a custom React visual editor. A production Puck integration is **not** verified.

---

# Devfolio Studio — Delivery Roadmap

- Phase 0 — Dependency-free visual editor feasibility: completed local demo.
- Phase 1 — Next.js/React and account/database foundation: source implemented, live integration not verified.
- Phase 2 — Projects, media, categories, careers and GitHub import: source implemented, live integration not verified.
- Phase 3 — Responsive freeform editor and template presets: custom React implementation with local tests; Puck remains unverified.
- Phase 4 — Authenticated publishing snapshots, history, restore and public routes: local implementation verified; no live hosting.
- **Phase 5 — Production readiness foundation:** security headers, database publication throttling, trusted host/callback safeguards, health readiness, error recovery, CI, staging two-account smoke tests and operations documentation; local tests verified, **live staging acceptance pending**.
- Phase 6 — Production deployment and invite-only user beta: requires GitHub source/lockfile, Supabase staging + production, Vercel, domain DNS, SMTP, monitoring and full integration tests.

Do not confuse completed source milestones with a deployed service.
