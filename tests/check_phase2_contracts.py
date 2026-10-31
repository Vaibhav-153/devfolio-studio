from pathlib import Path
root=Path(__file__).resolve().parents[1]
def read(p):return (root/p).read_text()
sql=read('supabase/migrations/202610310002_content_management.sql')
for table in ['project_categories','project_media','experience_entries','education_entries','certifications','skill_groups','skills','github_import_events']:
 assert f'public.{table}' in sql,table
for s in ['enable row level security','auth.uid()','project_media_one_cover','category_id','constraint media_project_same_portfolio','constraint media_asset_same_portfolio','constraint skills_same_portfolio','complete_media_upload','consume_github_import_quota','delete_project_category','set_project_cover','reorder_project_media']:
 assert s in sql,s
assert "Private draft media is intentionally excluded until Phase 4" in sql
for p in ['app/dashboard/projects/page.tsx','app/dashboard/projects/[id]/page.tsx','app/dashboard/projects/new/page.tsx','app/dashboard/categories/page.tsx','app/dashboard/career/page.tsx','app/dashboard/skills/page.tsx','app/dashboard/media/page.tsx','components/dashboard/MediaManager.tsx','components/dashboard/CareerWorkspace.tsx','components/dashboard/SkillWorkspace.tsx','actions/github.ts','lib/content.ts']:
 assert (root/p).exists(),p
assert 'parseGitHubRepoUrl' in read('actions/github.ts')
assert 'https://api.github.com/repos/' in read('actions/github.ts')
assert 'consume_github_import_quota' in read('actions/github.ts')
assert 'requirePortfolio()' in read('actions/content.ts')
assert 'project_media' in read('actions/content.ts')
assert '.createSignedUrl(' in read('app/dashboard/media/page.tsx')
assert 'portfolio-drafts' in read('components/dashboard/MediaManager.tsx')
assert 'setCoverImageAction' in read('components/dashboard/MediaManager.tsx')
assert 'Experience' in read('components/portfolio/PortfolioRenderer.tsx')
assert 'cleanSnapshot' in read('lib/validation.ts')
print('Phase 2 structural contracts passed.')
