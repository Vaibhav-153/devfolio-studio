from pathlib import Path
r=Path(__file__).resolve().parent.parent
read=lambda p:(r/p).read_text()
checks={
 'security headers configured':all(t in read('next.config.ts') for t in ['X-Frame-Options','nosniff','Referrer-Policy','Content-Security-Policy-Report-Only']),
 'not falsely claiming CSP enforcement': 'Report-Only' in read('next.config.ts'),
 'wildcard host restrictions': 'isUnrecognizedChildHost' in read('proxy.ts'),
 'app URL used for auth redirects':'appUrl' in read('app/auth/callback/route.ts'),
 'real readiness probe with no secrets returned':'not_ready' in read('app/health/ready/route.ts') and "rpc('get_public_portfolio'" in read('app/health/ready/route.ts'),
 'publication rate limit enforced by trigger':'devfolio_release_quota before insert' in read('supabase/migrations/202610310004_production_hardening.sql'),
 'preflight before media promotion': read('actions/publishing.ts').index("rpc('check_release_quota'") < read('actions/publishing.ts').index('preparePublishedImages(images'),
 'staging account-isolation integration script':'Cross-account private draft SELECT blocked' in read('scripts/staging-smoke.mjs'),
 'explicit lockfile gate in CI':'Require reviewed dependency lockfile' in read('.github/workflows/ci.yml'),
 'private staging test environment':'environment: staging' in read('.github/workflows/staging-security.yml'),
 'accessible error and skip controls':'skip-link' in read('app/layout.tsx') and 'recovery-page' in read('app/error.tsx'),
 'sanitized production logging':'console.error(JSON.stringify(safe))' in read('lib/operations.ts'),
}
for label,ok in checks.items():print(('PASS' if ok else 'FAIL')+': '+label)
if not all(checks.values()):raise SystemExit(1)
