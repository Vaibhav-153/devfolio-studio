# Operations and incident-response runbook

## Liveness vs readiness

- `GET /health` is a process-level liveness endpoint. It does not access the database.
- `GET /health/ready` returns HTTP 200 only if the required Supabase configuration exists and the anonymous-safe `get_public_portfolio` RPC is reachable; otherwise 503. It does not query private user tables.
- Configure external uptime checks against readiness, with alerts to the platform owner. Never expose environment variables or stack traces in responses.

## Alerts to configure outside this repository

1. Availability: repeated readiness failures and public-domain HTTPS failure.
2. Authentication: excessive failed login/reset requests and deliverability failure.
3. Publishing: repeated release activation failures or storage quota warnings.
4. Platform: server errors, database exhaustion and elevated page latency.
5. Abuse: spam accounts, content abuse, excessive image uploads and anonymous scraping.

Structured server errors are intentionally sanitized. Logs should not contain emails, usernames, access tokens, freeform layouts, résumé contents or private Supabase paths.

## Incident severity and first response

| Severity | Example | Response |
|---|---|---|
| Critical | Cross-tenant data exposure, leaked service role credential | Disable affected feature, rotate credential, revoke access, preserve logs, investigate affected data and follow required disclosure process |
| High | Public publishing repeatedly fails or portfolio content is wrong | Freeze new releases, retain last known good snapshot, assess DB integrity and image references |
| Moderate | Degraded preview or email verification | Post a status update, triage the failing dependency and use a documented workaround |

## Publishing recovery

- Do not delete historical release records to resolve publishing errors.
- A failed or timed-out asset promotion may leave orphan public files. First reconcile public storage paths against all active **and historical** snapshot references. Default to retaining uncertain files.
- If an active release is incorrect, use the owner-authorized restore operation to create a new release from a known good snapshot.
- Unpublish stops public HTML rendering but does **not** instantly revoke previously cached image URLs.
- `publish_portfolio_v2` activation is a database transaction; failed preparation should leave the old live release intact.

## Database backup and recovery

Before public beta, enable backups appropriate to your Supabase plan, export and test schema + data restoration into isolated staging, and document recovery-point and recovery-time targets. Never rehearse destructive restore actions in production.

## Security operations

- Keep `SUPABASE_SERVICE_ROLE_KEY` only on the server and private CI staging environment. Rotate it if exposure is suspected.
- Inspect Supabase Security Advisor routinely, and regularly test authenticated/anonymous policies for every user-owned table and Storage bucket.
- Require MFA for platform administrator accounts.
- Apply environment-specific SMTP and signup throttling; the SQL publication quota only protects release creation, not the whole app.
- Audit CSP reports in staging. CSP is report-only until tested with actual hosted editor, storage and external fonts.

## Exit from an incident

Confirm the root cause, affected versions, status of published portfolios, restored functionality and security patches. Record a blameless incident report, add regression tests, and update the runbook.
