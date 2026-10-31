"""Static structural checks. These do NOT replace integration tests against a real Supabase database."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
required=[
  'app/page.tsx','app/demo/page.tsx','app/dashboard/page.tsx','app/studio/[pageKey]/page.tsx',
  'app/p/[handle]/[[...slug]]/page.tsx','app/auth/callback/route.ts','actions/portfolio.ts',
  'components/studio/Studio.tsx','components/portfolio/PortfolioRenderer.tsx',
  'supabase/migrations/202610310001_initial.sql','proxy.ts','lib/validation.ts',
]
for file in required: assert (root/file).exists(),file
sql=(root/'supabase/migrations/202610310001_initial.sql').read_text()
for item in ('alter table public.portfolios enable row level security','alter table public.projects enable row level security','alter table public.page_drafts enable row level security','get_public_portfolio','and p.status=\'published\'','save_page_draft','p.owner_id=auth.uid()','revoke all on public.profiles','grant select,update(handle,template)'):
    assert item in sql,item
for code in root.rglob('*.tsx'):
    assert 'dangerouslySetInnerHTML' not in code.read_text(),code
print('PASS: 12 app files, RLS and RPC declarations, safe rendering boundary')
print('NOTE: No live database or npm dependency integration was tested.')
