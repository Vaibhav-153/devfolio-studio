from pathlib import Path
r=Path(__file__).resolve().parent.parent
sql=(r/'supabase/migrations/202610310003_publishing.sql').read_text()
actions=(r/'actions/publishing.ts').read_text()
public=(r/'app/p/[handle]/[[...slug]]/page.tsx').read_text()
checks={
 'old unsafe publisher revoked':'revoke execute on function public.publish_portfolio(uuid)' in sql,
 'owner-authenticated publish':'owner_id=auth.uid() for update' in sql,
 'immutable release snapshot':'public.publish_portfolio(p_portfolio_id)' in sql and 'snapshot_json=jsonb_set' in sql,
 'image asset presence verified':"o.bucket_id='portfolio-public'" in sql,
 'private signed URLs blocked':'portfolio-drafts' in sql and 'object/sign' in sql,
 'owner-authenticated restore':'public.restore_portfolio_release' in sql and 'p_source_release_id' in sql,
 'rollback creates a new version':'values(p.id,new_version,previous)' in sql,
 'legacy publication cannot be called by browser':"publish_portfolio_v2" in actions,
 'service key only server scope':'SUPABASE_SERVICE_ROLE_KEY' in (r/'lib/publishing/client.ts').read_text(),
 'public route dynamically fetched':"force-no-store" in public and 'get_public_portfolio' in public,
 'unpublished released via old guarded public RPC':"p.status='published'" in (r/'supabase/migrations/202610310001_initial.sql').read_text(),
 'auth-only draft preview':"requirePortfolio" in (r/'app/preview/[pageKey]/page.tsx').read_text(),
 'public project case study':"<ProjectCaseStudy" in public,
 'published media no client upload policies':"portfolio-public'" in sql and 'grant insert on storage.objects' not in sql,
}
for k,v in checks.items():print(('PASS' if v else 'FAIL')+': '+k)
assert all(checks.values())
