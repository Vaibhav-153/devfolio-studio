# Development and deployment setup

## 1. Requirements

- Node.js >= 20.9, npm.
- A dedicated Supabase project.
- A Vercel project for hosting.
- An owned root domain only when deploying wildcard subdomains.
- A production transactional email provider before accepting public users.

## 2. Supabase

1. Create a new Supabase project.
2. Open **SQL Editor** and execute `supabase/migrations/202610310001_initial.sql` once. The migration is designed for a new project, not for repeated execution in an existing project.
3. Inspect all tables, policies and functions after applying the SQL.
4. In Authentication settings, enable email/password and require email confirmation.
5. Configure your own SMTP provider for production. The default Supabase sender is not suitable for a public SaaS.
6. Under Auth URL Configuration, set Site URL to your application origin. Add `http://localhost:3000/auth/callback` and your production `https://app.YOUR_DOMAIN/auth/callback` to allowed redirect URLs. The password recovery callback uses the same path with an approved `next=/reset-password` query.
7. Copy Project URL and Publishable Key to `.env.local`. **Never put a service role key in an environment variable prefixed with `NEXT_PUBLIC_`.**

Example `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_XXXXX
NEXT_PUBLIC_ROOT_DOMAIN=localhost
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3. Install and test

```bash
npm install
npm run typecheck
npm run test:unit
npm run test:contracts
npm run build
npm run dev
```

Use two real test accounts. Check separately that account B cannot list, edit or delete account A's projects or private page drafts, even by sending direct requests using A's IDs. Inspect `docs/SECURITY.md` for additional checks.

## 4. Real portfolio smoke test

1. Sign up with a fresh email and confirm it.
2. Sign in, update your name and role, add a project, and set a valid username.
3. Open Visual Designer and make a visible layout change; wait for **Saved online**.
4. Reload and confirm the change persisted.
5. Publish from the dashboard, then visit the direct test route `/p/YOUR_HANDLE`.
6. Make an unpublished profile/project change, refresh the public route, and confirm the old release remains live.
7. Republish, confirm the new content appears. Unpublish and confirm the route returns not found.
8. Test another user cannot query the private draft rows or trigger publication on your portfolio ID.

This process has not been run in the authoring environment because no Supabase instance was connected.

## 5. Vercel setup

1. Push the project to a GitHub repository, excluding `.env.local`.
2. Import the repository into Vercel and choose Next.js. Set the environment variables.
3. Configure your owned root domain for the marketing/app host and the wildcard `*.YOUR_DOMAIN` according to your hosting DNS instructions. A wildcard route may require DNS verification and an appropriate Vercel plan.
4. Set `NEXT_PUBLIC_ROOT_DOMAIN=YOUR_DOMAIN` and `NEXT_PUBLIC_APP_URL=https://app.YOUR_DOMAIN`.
5. Deploy to staging first; test the root application host and two distinct published subdomains. Vercel must send the original Host header to the Next.js Proxy for tenant rewrites.
6. Verify that authenticated sessions are not shared with unrelated tenant subdomains. Keep app cookies host-scoped.
7. Enable operational monitoring, rate limiting, backups and audit checks before any public beta.

### Local subdomain testing

Use `http://localhost:3000/p/YOUR_HANDLE` as the primary test. `YOUR_HANDLE.localhost` depends on OS/browser host resolution; do not require it for initial setup.

## 6. Known blockers / limitations

- The authoring environment cannot fetch npm packages (DNS `EAI_AGAIN`), so the actual production build is **not verified**.
- Supabase SQL migration syntax and RLS semantics need a live PostgreSQL/Supabase execution test.
- No domain or wildcard DNS has been configured.
- The basic publication RPC and public route are an early implementation, not final production publishing.
- The visual designer is a React port of the Phase 0 reference; Puck and nested freeform interoperability remain a future engineering milestone.

## Phase 2 addendum (run after Phase 1 setup)

1. Apply `supabase/migrations/202610310002_content_management.sql` after the initial migration. Do not skip migration order.
2. Confirm tables `project_categories`, `project_media`, `experience_entries`, `education_entries`, `certifications`, `skill_groups`, `skills` exist and RLS is enabled.
3. Confirm the private bucket `portfolio-drafts` exists and the authenticated user can only access their own UUID-prefixed object paths.
4. Use the dashboard to create categories, projects, case studies, career entries, skill groups and private screenshot uploads.
5. Verify a second test user cannot query, modify, attach or sign media owned by the first user. Review `docs/MEDIA_PRIVACY.md`.
6. Check the GitHub API importer works for a public repository and rejects untrusted hostnames, branches and private repositories.
7. Run `npm run typecheck`, `npm run lint`, `npm run build`, and all tests in a connected development environment.

**Do not present the image gallery as publicly published yet.** Private images appear only in authenticated draft/editor previews; Phase 4 must provide versioned public-asset promotion.
