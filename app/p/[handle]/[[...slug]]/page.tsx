import {createClient} from '@supabase/supabase-js';
import {cache} from 'react';
import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {hasSupabaseConfig} from '@/lib/config';
import {PortfolioRenderer} from '@/components/portfolio/PortfolioRenderer';
import {ProjectCaseStudy} from '@/components/portfolio/ProjectCaseStudy';
import {hydratePublishedSnapshot,safeProjectPath} from '@/lib/publishing/media';
import {portfolioPublicUrl} from '@/lib/publishing/urls';
import {validHandle} from '@/lib/validation';
import {getTenantHandle} from '@/lib/host';
export const dynamic='force-dynamic';
export const revalidate=0;
export const fetchCache='force-no-store';

const loadPublished=cache(async(handle:string)=>{
 if(!hasSupabaseConfig()||!validHandle(handle))return null;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL!;
 const client=createClient(url,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.rpc('get_public_portfolio',{p_handle:handle});
 if(error||!data)return null;
 return hydratePublishedSnapshot(data,url);
});
type Params={params:Promise<{handle:string;slug?:string[]}>};
function resolveRoute(doc:NonNullable<Awaited<ReturnType<typeof loadPublished>>>,slug:string[]){
 if(!slug.length)return {page:doc.pages.find(p=>p.key==='home'),project:undefined};
 if(slug.length===1)return {page:doc.pages.find(p=>p.key===slug[0]),project:undefined};
 if(slug.length===2&&slug[0]==='projects'&&safeProjectPath(slug[1]))return {page:undefined,project:doc.projects.find(p=>p.slug===slug[1]&&p.visible!==false)};
 return {page:undefined,project:undefined};
}
export async function generateMetadata({params}:Params):Promise<Metadata>{
 const {handle,slug=[]}=await params;
 const doc=await loadPublished(handle);
 if(!doc)return {title:'Portfolio not found',robots:{index:false,follow:false}};
 const route=resolveRoute(doc,slug);if(!route.page&&!route.project)return {title:'Page not found',robots:{index:false,follow:false}};
 const title=route.project?`${route.project.title} | ${doc.site.name}`:slug.length?`${route.page?.title} | ${doc.site.name}`:`${doc.site.name} | ${doc.site.role}`;
 const description=route.project?.summary.slice(0,160)||doc.site.intro.slice(0,160);
 const url=portfolioPublicUrl(handle)+(slug.length?`/${slug.join('/')}`:'');
 const image=route.project?.coverUrl;
 return {title,description,alternates:{canonical:url},robots:{index:true,follow:true},openGraph:{type:'website',title,description,url,...(image?{images:[{url:image,alt:route.project?.title}]}:{})}};
}
export default async function PublishedPortfolio({params}:Params){
 const {handle,slug=[]}=await params;const doc=await loadPublished(handle);if(!doc)notFound();
 const route=resolveRoute(doc,slug);if(!route.page&&!route.project)notFound();
 const incomingHost=(await headers()).get('host')||'';
 const basePath=getTenantHandle(incomingHost)===handle?'':`/p/${handle}`;
 if(route.project)return <ProjectCaseStudy project={route.project} site={doc.site} template={doc.template} basePath={basePath}/>;
 return <PortfolioRenderer layout={route.page!.layout} site={doc.site} projects={doc.projects} template={doc.template} experience={doc.experience||[]} education={doc.education||[]} certifications={doc.certifications||[]} skillGroups={doc.skillGroups||[]} basePath={basePath}/>;
}
