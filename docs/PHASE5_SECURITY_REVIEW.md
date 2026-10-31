# Security decisions and checks

| Attack surface | Current approach | Outstanding live verification |
|---|---|---|
| Account sessions | Supabase SSR cookies and owner-checked server actions | Check real cookie scope, logout, expired sessions, recovery flow |
| Tenant host routing | Canonical handles, invalid wildcard host 404, dashboard blocked on valid tenant hosts | Validate against real domains, forwarded Host handling and DNS |
| Draft ownership | Row Level Security and server ownership checks | Two-account integration test in real Postgres |
| Publication | Owner-only RPC, immutable snapshot activation and quota trigger | Rate-limit concurrency, rollback, version integrity |
| Media | Private draft bucket, magic-byte checks, versioned public copies | Storage RLS, upload abuse, antivirus/metadata policies |
| User-authored links | Only http(s) permitted by layout validation | Check external image privacy and broken links |
| Server credentials | Service-role key only used in server publication module | Bundle review and Vercel environment scoping |
| Headers | No sniffing, frame denial, referrer and permissions policy | CSP currently Report-Only; browser compatibility and final enforcement |
| Operational logs | Structured logs with event type, code, timestamps | External sink, alert thresholds and log retention |
| Abuse | GitHub import quota, publication release quota | Upstream WAF and signup/reset rate limits not yet configured |

**Boundary:** visual-editor HTML previews and source-based tests do not prove any real Supabase policy is secure. Server-side credentials must not be used from Client Components. Test Auth and Storage RLS with two independent authenticated sessions before public access.
