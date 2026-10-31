# Devfolio Studio - Phase 6 staging launch kit

**Status:** Developer beta readiness tools prepared; NOT deployed. The previous Phase 1-5 builder source remains included.

New in Phase 6:

- `app/dashboard/feedback/` - account-owned beta feedback interface, guarded action, and PostgreSQL RLS plus submission throttle (migration 005).
- `scripts/release-preflight.mjs` - checks environment shape, source prerequisites and reproducibility, never printing secrets.
- `scripts/release-smoke.mjs` - read-only deployed root, health, auth protection and optional wildcard domain checks.
- `scripts/staging-smoke.mjs` - extended two-account staging authorization tests including feedback ownership; destructive and gated by both user confirmation and staging project ref.
- `.github/workflows/deployed-smoke.yml` - opt-in GitHub Actions staging checks.
- `preview-phase6/index.html` - independent offline release checklist with locally saved manual status.
- `docs/PHASE6_DEPLOYMENT.md`, `docs/BETA_TEST_PLAN.md`, `docs/PHASE6_STATUS.md` - deployment and beta procedures.

## Try the launch console

Open `preview-phase6/index.html` in a browser. The checklist stores only your own manual status. It cannot verify real deployments.

## Run local checks

`npm run test:phase6` runs dependency-light unit tests. `npm run verify:phase6` also includes all earlier available local tests. For the real Next.js app, install dependencies with Node 22 and run `npm run lint`, `npm run typecheck`, and `npm run build`.

**Build limitation:** In this environment the npm registry could not be reached. A reviewed package-lock file and a successful real Next.js build are mandatory before staging. No live service was connected.

Start with `docs/PHASE6_DEPLOYMENT.md`. Do not share private credentials in chat or public repositories.

---

# Devfolio Studio — Phase 5

**A multi-tenant, no-code portfolio builder for developers, with responsive visual editing and versioned portfolio publishing.**

Phase 5 improves production readiness while preserving the existing Phase 1–4 application, dashboard, project management, visual editor, templates and publishing workflows.

> **Deployment status:** This package has locally tested source code and offline demos. It is **not yet a production-verified or hosted SaaS**. Supabase and Vercel accounts, dependencies, a reviewed lockfile and end-to-end staging verification are still required.

## What's new

- Safe host routing for unknown subdomains; trusted auth callback destination.
- Global browser security headers and report-only Content Security Policy.
- Readiness probe `/health/ready` (separate from liveness `/health`).
- Publication rate limit enforced by a database trigger plus an inexpensive owner-scoped preflight.
- More accessible error handling, skip link and reduced-motion support.
- CI quality gates; explicit requirement for a reviewed dependency lockfile.
- A staging-only script that tests two isolated accounts, publishing, rollback and unauthorized operations.
- A read-only deployed HTTP probe, operations runbook and go-live checklist.
- A standalone [Phase 5 readiness dashboard](preview-phase5/standalone.html) for tracking external launch gates. It does **not** run deployment tests itself.

## Begin here

1. Open `preview-phase5/standalone.html` for an offline, interactive release checklist.
2. Open `preview-phase4/index.html` for the offline publishing simulation, or `preview-phase3/index.html` for the visual-editor demo.
3. Read `docs/PHASE5_GO_LIVE.md` before configuring any external service.
4. On a computer with npm access, install Node 22, run `npm install` and **commit the generated `package-lock.json`** after reviewing dependency versions. Run `npm run verify:all`, `npm run lint`, `npm run typecheck`, and `npm run build`.
5. Apply all four `supabase/migrations` SQL files in numerical order to an isolated staging project and configure private environment variables.
6. Run `node scripts/staging-smoke.mjs` only with the explicit disposable-staging opt-in described in the go-live guide.

### Environment variables

Copy `.env.example` to `.env.local` and configure these with your own service account values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (**server only, never share or commit**)
- `NEXT_PUBLIC_ROOT_DOMAIN`
- `NEXT_PUBLIC_APP_URL`

### Local checks performed

```bash
npm run test:phase5
npm run typecheck:pure
npm run test:syntax
python3 tests/check_phase5_contracts.py
python3 tests/browser_phase5.py
```

These pure-source checks do not require a database. Full Next.js build and authenticated staging tests **were not available in the authoring environment**.

## Architecture

The app uses Next.js 16, React 19, TypeScript, Supabase Auth/PostgreSQL/Storage and a shared tenant renderer. The visual editor is custom React (Puck not yet integrated). Public portfolios read immutable released snapshots, not draft rows. The browser cannot directly overwrite published releases. Public images are promoted to versioned paths, with a beta cap of 24 unique gallery images per release.

## Key documents

- `docs/PHASE5_GO_LIVE.md`: deployment and sign-off steps.
- `docs/PHASE5_VERIFICATION.md`: precise local test evidence and limitations.
- `docs/PHASE5_SECURITY_REVIEW.md`: threat surfaces and pending tests.
- `docs/OPERATIONS_RUNBOOK.md`: incidents, backups, publication failure recovery.
- `docs/ROADMAP.md`: what Phase 6 requires.

**Important:** Phase 5 adds protection against burst publication but is not a complete anti-abuse or infrastructure package. Configure WAF, email protection, monitoring, backup/restore tests and enforced CSP before an unrestricted public beta.
