import {requirePortfolio} from "@/lib/auth";
import {MediaLibrary} from "@/components/dashboard/MediaManager";
import type {MediaAsset} from "@/lib/content";
export default async function MediaPage(){const {portfolio,supabase}=await requirePortfolio();const {data,error}=await supabase.from("media_assets").select("id,file_name,mime_type,byte_size,kind,alt_text,storage_path,upload_status").eq("portfolio_id",portfolio.id).order("created_at",{ascending:false}).limit(150);if(error)throw new Error(error.message);
 const assets:MediaAsset[]=await Promise.all((data||[]).map(async a=>{
  let preview_url="";
  if(a.upload_status==="ready"&&a.kind==="image"){
   const {data:link}=await supabase.storage.from("portfolio-drafts").createSignedUrl(a.storage_path,900);preview_url=link?.signedUrl||"";
  }
  return {...a,preview_url};
 }));
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">CONTENT LIBRARY</span><h1>Media library</h1><p>Keep your project screenshots, diagrams and résumé in one secure place.</p></div></div><MediaLibrary assets={assets}/></main>;
}
