# Private media now; public media promotion later

**Draft storage:** `portfolio-drafts` is a private Supabase Storage bucket. All uploads use paths beginning with the authenticated user's UUID and are access-restricted by RLS. The dashboard obtains short-lived signed URLs for displaying owned images; these expire after 15 minutes.

**Supported formats:** JPEG, PNG, WebP and PDF; maximum 5 MiB per file; up to 150 media asset metadata records per portfolio in the current server actions. Project galleries accept images only (up to 12 per project).

**Release boundaries:** A published HTML snapshot can contain new project descriptions, experience and skills, but must not embed a private draft-media signed URL. That URL would expire and may disclose otherwise private content. Therefore Phase 2 intentionally leaves images out of public published snapshots until the dedicated release-media flow is built.

**Phase 4 requirement:** Publish must create immutable public copies of selected images, record versioned immutable asset URLs in the release snapshot, verify successful promotion, and only then atomically activate a new published snapshot. Rollback must preserve historic asset references. Files that belong to active or historical published versions cannot be prematurely removed. Unpublishing hides pages but cannot guarantee third-party cached copies of public media vanish.

**Additional verification before production:** magic-byte file validation (not only client-declared MIME), antivirus/scanning policy, authenticated storage RLS tests, metadata-to-storage consistency tests, rate limits, account deletion and media garbage collection. No service-role key should ever be exposed to the browser.
