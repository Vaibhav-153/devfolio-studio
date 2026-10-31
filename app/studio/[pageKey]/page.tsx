import {notFound} from "next/navigation";
import {requirePortfolio} from "@/lib/auth";
import {cleanLayout,cleanSite,cleanProject} from "@/lib/validation";
import {Studio} from "@/components/studio/Studio";
import type {SkillGroup} from "@/lib/content";
export const dynamic="force-dynamic";
export default async function StudioPage({params}:{params:Promise<{pageKey:string}>}){
 const {pageKey}=await params;const {portfolio,supabase}=await requirePortfolio();
 const {data:page}=await supabase.from("portfolio_pages").select("id,page_key").eq("portfolio_id",portfolio.id).eq("page_key",pageKey).maybeSingle();if(!page)notFound();
 const [draftResponse,profileResponse,projectsResponse,experienceResponse,educationResponse,certResponse,groupsResponse,skillsResponse,imagesResponse,assetsResponse]=await Promise.all([
  supabase.from("page_drafts").select("layout_json,revision").eq("page_id",page.id).single(),
  supabase.from("portfolio_profiles").select("*").eq("portfolio_id",portfolio.id).single(),
  supabase.from("projects").select("*").eq("portfolio_id",portfolio.id).order("sort_order").order("created_at"),
  supabase.from("experience_entries").select("*").eq("portfolio_id",portfolio.id).order("sort_order"),
  supabase.from("education_entries").select("*").eq("portfolio_id",portfolio.id).order("sort_order"),
  supabase.from("certifications").select("*").eq("portfolio_id",portfolio.id).order("sort_order"),
  supabase.from("skill_groups").select("id,name,sort_order").eq("portfolio_id",portfolio.id).order("sort_order"),
  supabase.from("skills").select("group_id,name,sort_order").eq("portfolio_id",portfolio.id).order("sort_order"),
  supabase.from("project_media").select("project_id,asset_id,is_cover,sort_order").eq("portfolio_id",portfolio.id).order("sort_order"),
  supabase.from("media_assets").select("id,storage_path,kind,upload_status").eq("portfolio_id",portfolio.id)
 ]);
 const draft=draftResponse.data,profile=profileResponse.data;if(!draft||!profile)throw new Error("Your portfolio editor data is missing.");
 const groups:SkillGroup[]=(groupsResponse.data||[]).map(g=>({...g,skills:(skillsResponse.data||[]).filter(s=>s.group_id===g.id).map(s=>s.name)}));
 const covers=(imagesResponse.data||[]).filter(m=>m.is_cover);
 const paths=(assetsResponse.data||[]).filter(a=>a.kind==="image"&&a.upload_status==="ready"&&covers.some(m=>m.asset_id===a.id));
 const links=await Promise.all(paths.map(async a=>{const {data}=await supabase.storage.from("portfolio-drafts").createSignedUrl(a.storage_path,900);return [a.id,data?.signedUrl||""] as const;}));
 const urlMap=new Map<string,string>(links);const coverMap=new Map(covers.map(m=>[m.project_id,urlMap.get(m.asset_id)||""]));
 const projects=(projectsResponse.data||[]).map(p=>({...cleanProject(p),coverUrl:coverMap.get(p.id)||""}));
 const skills=groups.length?groups.flatMap(g=>g.skills):profile.skills;
 return <Studio key={page.id} pageId={page.id} pageKey={pageKey} initialLayout={cleanLayout(draft.layout_json)} initialRevision={draft.revision}
  site={cleanSite({name:profile.name,role:profile.role,heroOne:profile.hero_one,heroTwo:profile.hero_two,intro:profile.intro,about:profile.about,email:profile.email,github:profile.github,linkedin:profile.linkedin,skills})}
  projects={projects} template={portfolio.template} handle={portfolio.handle}
  experience={experienceResponse.data||[]} education={educationResponse.data||[]} certifications={certResponse.data||[]} skillGroups={groups}/>;
}
