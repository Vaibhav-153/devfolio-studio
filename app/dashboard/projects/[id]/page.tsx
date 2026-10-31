import Link from "next/link";
import {notFound} from "next/navigation";
import {requirePortfolio} from "@/lib/auth";
import {ProjectForm} from "@/components/dashboard/Forms";
import {ProjectGalleryManager} from "@/components/dashboard/MediaManager";
import {cleanProject} from "@/lib/validation";
import type {MediaAsset,ProjectImage} from "@/lib/content";
export default async function EditProject({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const {portfolio,supabase}=await requirePortfolio();
 const [{data:project},{data:categories},{data:images},{data:assets}]=await Promise.all([
  supabase.from("projects").select("*").eq("id",id).eq("portfolio_id",portfolio.id).maybeSingle(),
  supabase.from("project_categories").select("id,name,slug,sort_order").eq("portfolio_id",portfolio.id).order("sort_order"),
  supabase.from("project_media").select("id,asset_id,project_id,alt_text,caption,sort_order,is_cover").eq("project_id",id).eq("portfolio_id",portfolio.id).order("sort_order"),
  supabase.from("media_assets").select("id,file_name,mime_type,byte_size,kind,alt_text,storage_path,upload_status").eq("portfolio_id",portfolio.id).order("created_at",{ascending:false}).limit(150)
 ]);
 if(!project)notFound();
 const media:MediaAsset[]=await Promise.all((assets||[]).map(async a=>{const {data:link}=a.kind==="image"&&a.upload_status==="ready"?await supabase.storage.from("portfolio-drafts").createSignedUrl(a.storage_path,900):{data:null};return {...a,preview_url:link?.signedUrl||""};}));
 const gallery:ProjectImage[]=(images||[]).map(x=>({...x,url:media.find(a=>a.id===x.asset_id)?.preview_url||""}));
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">PROJECT MANAGER</span><h1>Edit project</h1><p>Content updates are reflected in your visual builder. Saving does not publish.</p></div><Link className="button" href="/dashboard/projects">All projects</Link></div><section className="panel-card form-panel"><ProjectForm initial={cleanProject(project)} categories={categories||[]}/></section><ProjectGalleryManager projectId={id} images={gallery} assets={media}/></main>;
}
