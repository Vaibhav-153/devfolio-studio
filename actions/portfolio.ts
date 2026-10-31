"use server";
import {revalidatePath} from "next/cache";
import {requirePortfolio} from "@/lib/auth";
import {cleanLayout,cleanSite,safeHttpUrl,validHandle} from "@/lib/validation";
import type {TemplateName} from "@/lib/models";

type Result={ok:boolean;message:string;id?:string;revision?:number;version?:number};
const field=(fd:FormData,k:string)=>String(fd.get(k)||"");
const slugOf=(v:string)=>v.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g,"").trim().replace(/[\s-]+/g,"-").slice(0,100).replace(/-+$/,"");

export async function saveProfileAction(fd:FormData):Promise<Result>{
 try{const {portfolio,supabase}=await requirePortfolio();
  const site=cleanSite({name:field(fd,"name"),role:field(fd,"role"),heroOne:field(fd,"heroOne"),heroTwo:field(fd,"heroTwo"),intro:field(fd,"intro"),about:field(fd,"about"),email:field(fd,"email"),github:field(fd,"github"),linkedin:field(fd,"linkedin"),skills:field(fd,"skills").split(",").map(x=>x.trim()).filter(Boolean)});
  if(!site.name||!site.role)return {ok:false,message:"Please add your name and professional role."};
  const {error}=await supabase.from("portfolio_profiles").update({name:site.name,role:site.role,hero_one:site.heroOne,hero_two:site.heroTwo,intro:site.intro,about:site.about,email:site.email,github:site.github,linkedin:site.linkedin,skills:site.skills}).eq("portfolio_id",portfolio.id);
  if(error)throw error;revalidatePath("/dashboard");revalidatePath("/dashboard/profile");return {ok:true,message:"Profile saved."};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:"Could not save profile."};}
}
export async function saveProjectAction(fd:FormData):Promise<Result>{
 try{const {portfolio,supabase}=await requirePortfolio();const id=field(fd,"id");
  const title=field(fd,"title").trim().slice(0,120);const slug=slugOf(field(fd,"slug")||title);
  if(!title||!slug)return {ok:false,message:"Please add a project title."};
  const categoryId=field(fd,"category_id")||null;
  let category=field(fd,"category_manual").trim().slice(0,60)||"Development";
  if(categoryId){const {data:categoryRow,error:catError}=await supabase.from("project_categories").select("name").eq("id",categoryId).eq("portfolio_id",portfolio.id).maybeSingle();if(catError)throw catError;if(!categoryRow)return {ok:false,message:"Invalid project category."};category=categoryRow.name;}
  for(const key of ["github","demo"]){if(field(fd,key)&&!safeHttpUrl(field(fd,key)))return {ok:false,message:`${key} must be a valid http or https URL.`};}
  const record={portfolio_id:portfolio.id,title,slug,category,category_id:categoryId,summary:field(fd,"summary").slice(0,1800),tech:field(fd,"tech").split(",").map(x=>x.trim().slice(0,40)).filter(Boolean).slice(0,30),github:safeHttpUrl(field(fd,"github")),demo:safeHttpUrl(field(fd,"demo")),
    problem:field(fd,"problem").slice(0,3000),solution:field(fd,"solution").slice(0,3000),contribution:field(fd,"contribution").slice(0,2000),outcome:field(fd,"outcome").slice(0,2000),featured:field(fd,"featured")==="on",visible:field(fd,"visible")==="on"};
  if(id){const {data,error}=await supabase.from("projects").update(record).eq("id",id).eq("portfolio_id",portfolio.id).select("id").maybeSingle();if(error)throw error;if(!data)return {ok:false,message:"Project not found or not owned by you."};}
  else {const {data,error}=await supabase.from("projects").insert(record).select("id").single();if(error)throw error;revalidatePath("/dashboard/projects");revalidatePath("/studio/home");return {ok:true,message:"Project created.",id:data.id};}
  revalidatePath("/dashboard/projects");revalidatePath("/studio/home");return {ok:true,message:"Project saved.",id};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:"Could not save project."};}
}
export async function deleteProjectAction(id:string):Promise<Result>{
 try{const {portfolio,supabase}=await requirePortfolio();
  const {data,error}=await supabase.from("projects").delete().eq("id",id).eq("portfolio_id",portfolio.id).select("id").maybeSingle();
  if(error)throw error;if(!data)return {ok:false,message:"Project not found."};
  revalidatePath("/dashboard/projects");return {ok:true,message:"Project deleted."};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:"Could not delete project."};}
}
export async function saveSettingsAction(fd:FormData):Promise<Result>{
 try{const {portfolio,supabase}=await requirePortfolio();const raw=field(fd,"handle").trim().toLowerCase();const handle=raw||null;const theme=field(fd,"template");
  if(handle&&!validHandle(handle))return {ok:false,message:"Use 3–30 lowercase characters, starting with a letter. Some names are reserved."};
  if(!["minimal","midnight","grid"].includes(theme))return {ok:false,message:"Invalid template."};
  if(portfolio.status==="published"&&handle!==portfolio.handle)return {ok:false,message:"Published usernames cannot be changed in Release 1."};
  const {error}=await supabase.from("portfolios").update({handle,template:theme as TemplateName}).eq("id",portfolio.id);
  if(error)throw error;revalidatePath("/dashboard");revalidatePath("/dashboard/settings");return {ok:true,message:"Appearance and username saved."};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:"Could not save settings."};}
}
export async function saveLayoutAction(pageId:string,layout:unknown,expectedRevision:number):Promise<Result>{
 try{const {supabase,portfolio}=await requirePortfolio();const clean=cleanLayout(layout);
  const {data:page,error:pageErr}=await supabase.from("portfolio_pages").select("id").eq("id",pageId).eq("portfolio_id",portfolio.id).maybeSingle();
  if(pageErr)throw pageErr;if(!page)return {ok:false,message:"Page not found."};
  const {data,error}=await supabase.rpc("save_page_draft",{p_page_id:pageId,p_layout:clean,p_expected_revision:expectedRevision});
  if(error)throw error;return {ok:true,message:"Saved",revision:Number(data)};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:"Unable to save layout."};}
}
