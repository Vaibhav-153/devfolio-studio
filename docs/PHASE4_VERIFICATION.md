# Phase 4 Verification Report

## Verified in this environment

- Pure publication path generation and canonical public media URL validation.
- Rejection of unsupported image formats, unsafe paths and invalid layout schemas.
- Browser-only publication workflow: draft updates, local publishing, multiple releases, restores, unpublish, and mobile view.
- TypeScript source syntax parsing and isolated pure-source type checking.
- Structural validation of the SQL security and publishing contract.

## Not verified

- `npm install` / `next build`, due to unavailable npm registry DNS.
- Puck integration: the custom React visual editor remains in use.
- Executing SQL migrations on a real Supabase database.
- Live Supabase session creation, service-role storage operations and RPC calls.
- SSL wildcard domain mapping / real public subdomains.
- Actual cross-account isolation under Postgres and Storage RLS.
- Load testing, bulk media processing and serverless timeout behavior.

## Known operational limits

- The image promotion pipeline is synchronous with a maximum of 24 unique public image assets per release. Large files can exceed serverless execution limits in a real deployment.
- Public Storage image URLs are intentionally not revoked after unpublish or restore; stored historical releases remain self-consistent.
- Failed publication requests may leave orphan public assets. They must be cleaned only after checking all release references.
- In-editor image URLs referencing private signed Supabase Storage objects cannot be published; the SQL guard rejects them. Gallery files use the supported immutable path promotion pipeline.

## Required live acceptance tests

Use two independently registered accounts to test RLS and ownership, then publish version 1, modify draft, publish version 2, restore version 1 as version 3, unpublish, and verify public pages return 404. Also test DNS, metadata, sitemap, project gallery images, inaccessible URLs, rate limits, and rollback without loss of historical media.

See `docs/DEPLOYMENT_PHASE4.md` for the step-by-step staging procedure.
