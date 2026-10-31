import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {requirePortfolio} from '@/lib/auth';
import {cleanProject,cleanSite} from '@/lib/validation';
import {safeProjectPath,PRIVATE_MEDIA_BUCKET} from '@/lib/publishing/media';
import {ProjectCaseStudy} from '@/components/portfolio/ProjectCaseStudy';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Private case study preview | Devfolio Studio',robots:{index:false,follow:false}};
export default async function DraftCaseStudy({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 if(!safeProjectPath(slug))notFound();
 const {supabase,portfolio}=await requirePortfolio();
 const [projectResponse,profileResponse,assetResponse]=await Promise.all([
  supabase.from('projects').select('*').eq('portfolio_id',portfolio.id).eq('slug',slug).maybeSingle(),
  supabase.from('portfolio_profiles').select('*').eq('portfolio_id',portfolio.id).single(),
  supabase.from('media_assets').select('id,storage_path,kind,upload_status').eq('portfolio_id',portfolio.id)
 ]);
 const project=projectResponse.data,person=profileResponse.data;
 if(!project||!person)notFound();
 const {data:ownMedia}=await supabase.from('project_media').select('asset_id,is_cover,sort_order,alt_text,caption').eq('portfolio_id',portfolio.id).eq('project_id',project.id).order('sort_order');
 const paths=(assetResponse.data||[]).filter(a=>a.kind==='image'&&a.upload_status==='ready'&&(ownMedia||[]).some(x=>x.asset_id===a.id));
 const urls=await Promise.all(paths.map(async a=>[a.id,(await supabase.storage.from(PRIVATE_MEDIA_BUCKET).createSignedUrl(a.storage_path,600)).data?.signedUrl||''] as const));
 const map=new Map(urls);const cover=(ownMedia||[]).find(x=>x.is_cover);
 const visual={...cleanProject(project),coverUrl:cover?map.get(cover.asset_id)||'':'',gallery:(ownMedia||[]).map(x=>({url:map.get(x.asset_id)||'',alt:x.alt_text,caption:x.caption})).filter(x=>x.url)};
 const site=cleanSite({name:person.name,role:person.role,heroOne:person.hero_one,heroTwo:person.hero_two,intro:person.intro,about:person.about,email:person.email,github:person.github,linkedin:person.linkedin,skills:person.skills});
 return <><div className="private-preview-bar"><strong>Private case study preview</strong><span>Not published</span><div><Link href="/preview/projects">Projects</Link><Link href="/dashboard/publishing">Publishing</Link></div></div><ProjectCaseStudy project={visual} site={site} template={portfolio.template} basePath="/preview"/></>;
}
