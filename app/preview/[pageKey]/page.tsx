import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {requirePortfolio} from '@/lib/auth';
import {PortfolioRenderer} from '@/components/portfolio/PortfolioRenderer';
import {cleanLayout,cleanProject,cleanSite} from '@/lib/validation';
import type {SkillGroup} from '@/lib/content';
import {PRIVATE_MEDIA_BUCKET} from '@/lib/publishing/media';
export const dynamic='force-dynamic';
export const revalidate=0;
export const metadata:Metadata={title:'Private draft preview | Devfolio Studio',robots:{index:false,follow:false}};
export default async function PrivatePreview({params}:{params:Promise<{pageKey:string}>}){
 const {pageKey}=await params;
 const {supabase,portfolio}=await requirePortfolio();
 const {data:page}=await supabase.from('portfolio_pages').select('id,page_key,title').eq('portfolio_id',portfolio.id).eq('page_key',pageKey).maybeSingle();
 if(!page)notFound();
 const [draft,profile,projectRows,experiences,educations,certifications,groupRows,skillRows,relations,assets]=await Promise.all([
  supabase.from('page_drafts').select('layout_json').eq('page_id',page.id).single(),
  supabase.from('portfolio_profiles').select('*').eq('portfolio_id',portfolio.id).single(),
  supabase.from('projects').select('*').eq('portfolio_id',portfolio.id).order('sort_order'),
  supabase.from('experience_entries').select('*').eq('portfolio_id',portfolio.id).order('sort_order'),
  supabase.from('education_entries').select('*').eq('portfolio_id',portfolio.id).order('sort_order'),
  supabase.from('certifications').select('*').eq('portfolio_id',portfolio.id).order('sort_order'),
  supabase.from('skill_groups').select('id,name,sort_order').eq('portfolio_id',portfolio.id).order('sort_order'),
  supabase.from('skills').select('group_id,name,sort_order').eq('portfolio_id',portfolio.id).order('sort_order'),
  supabase.from('project_media').select('project_id,asset_id,is_cover,sort_order,alt_text,caption').eq('portfolio_id',portfolio.id).order('sort_order'),
  supabase.from('media_assets').select('id,storage_path,upload_status,kind').eq('portfolio_id',portfolio.id)
 ]);
 if(!draft.data||!profile.data)throw Error('Private preview data is missing.');
 const groups:SkillGroup[]=(groupRows.data||[]).map(g=>({...g,skills:(skillRows.data||[]).filter(s=>s.group_id===g.id).map(s=>s.name)}));
 const referencedIds=new Set((relations.data||[]).map(r=>r.asset_id));
 const paths=(assets.data||[]).filter(a=>a.kind==='image'&&a.upload_status==='ready'&&referencedIds.has(a.id));
 const signed=await Promise.all(paths.map(async a=>{
  const {data}=await supabase.storage.from(PRIVATE_MEDIA_BUCKET).createSignedUrl(a.storage_path,600);
  return [a.id,data?.signedUrl||''] as const;
 }));
 const urlMap=new Map<string,string>(signed);
 const projects=(projectRows.data||[]).map(p=>{
  const projectAssets=(relations.data||[]).filter(m=>m.project_id===p.id);
  const cover=projectAssets.find(m=>m.is_cover);
  return {...cleanProject(p),coverUrl:cover?urlMap.get(cover.asset_id)||'':'',gallery:projectAssets.map(m=>({url:urlMap.get(m.asset_id)||'',alt:m.alt_text,caption:m.caption})).filter(m=>m.url)};
 });
 const site=cleanSite({name:profile.data.name,role:profile.data.role,heroOne:profile.data.hero_one,heroTwo:profile.data.hero_two,intro:profile.data.intro,about:profile.data.about,email:profile.data.email,github:profile.data.github,linkedin:profile.data.linkedin,skills:groups.length?groups.flatMap(g=>g.skills):profile.data.skills});
 return <><div className="private-preview-bar"><strong>Private draft preview</strong><span>Only you can see this version. Publishing is a separate action.</span><div><Link href="/preview/home">Home</Link><Link href="/preview/projects">Projects</Link><Link href="/studio/home">Return to editor</Link><Link href="/dashboard/publishing">Publishing</Link></div></div>
  <PortfolioRenderer layout={cleanLayout(draft.data.layout_json)} site={site} projects={projects} template={portfolio.template} experience={experiences.data||[]} education={educations.data||[]} certifications={certifications.data||[]} skillGroups={groups} basePath="/preview"/>
 </>;
}
