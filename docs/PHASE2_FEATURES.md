# Phase 2 — Functional requirements and implementation notes

## Design principle
All projects, career entries, images and skills are **portfolio content**, not text duplicated inside template JSON. The visual renderer consumes approved block types and reads the content records as bindings. This allows users to change template styles without re-entering projects.

## Projects
The editor supports names, slugs, categories, technology tags, summary, source/demo links, optional problem, approach, contributions and verified outcomes. Visibility and featured status affect the next draft preview and publish snapshot. Project order is saved by an atomic, owner-checked SQL RPC. Category renaming propagates to linked project labels.

## GitHub imports
Only strict `https://github.com/owner/repo` public URLs are accepted. The server calls `api.github.com` directly, never an arbitrary caller-selected endpoint. Repository metadata and an optional README excerpt appear as **reviewable draft suggestions**, not automatically published content. The database RPC permits at most 20 attempts per user per hour and a minimum 5-second gap. API rate limits or missing README return actionable errors.

## Media
Upload intent is created server-side after authentication, MIME and size checks. The browser uploads into a private Supabase Storage bucket under the user's own UUID path. A server-checked database function confirms the object exists before setting its state to ready. Users can attach up to 12 images to one project; one cover per project is enforced through a partial unique index. Project and media composite foreign keys prevent cross-portfolio references.

## Career
Experience, education and certifications have dedicated tables and form editors. Dates and years are validated in both code and database checks. Certifications distinguish a verification URL from the credential name and issuer.

## Skills
Groups and skills are normalized. The legacy profile skills list is kept as a fallback for Phase 1 users; the renderer reads grouped skills when provided.

## Public renderer
New block types `Experience`, `Education` and `Certifications` are available in the editor. `ProjectGrid` respects hidden/featured status and can display signed private covers in the authenticated draft editor. Published snapshots include the new structured text fields, but never private draft-media URLs.

## Non-goals for Phase 2
- No production asset promotion to a public immutable release bucket.
- No unrestricted HTML or JavaScript authoring.
- No Puck integration claim; the current React editor is a separate in-house prototype.
- No live multi-user testing without Supabase credentials.
- No AI writing or automatic project performance claims.
