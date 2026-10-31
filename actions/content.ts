"use server";
import {revalidatePath} from "next/cache";
import {requirePortfolio} from "@/lib/auth";
import {approvedUpload,ensureDateRange,slugify,text,validIsoDate,validYear,type ActionStatus,type CareerKind} from "@/lib/content";
import {safeHttpUrl} from "@/lib/validation";

const get=(data:FormData,key:string)=>String(data.get(key)??"");
const refreshContent=()=>{revalidatePath("/dashboard");revalidatePath("/dashboard/projects");revalidatePath("/dashboard/career");revalidatePath("/dashboard/skills");};
const failure=(e:unknown):ActionStatus=>({ok:false,message:e instanceof Error?e.message:"Unable to complete this action."});

export async function saveCategoryAction(form:FormData):Promise<ActionStatus>{
 try {const {portfolio,supabase}=await requirePortfolio();const id=get(form,"id");const name=text(get(form,"name"),60);const slug=slugify(name);
  if(!name||!slug)throw Error("Please enter a category name using letters or numbers.");
  const value={name,slug,portfolio_id:portfolio.id};
  if(id){const {data,error}=await supabase.from("project_categories").update({name,slug}).eq("id",id).eq("portfolio_id",portfolio.id).select("id").maybeSingle();if(error)throw error;if(!data)throw Error("Category not found.");}
  else{const {error}=await supabase.from("project_categories").insert(value);if(error)throw error;}
  refreshContent();revalidatePath("/dashboard/categories");return {ok:true,message:"Category saved."};
 }catch(e){return failure(e);}
}
export async function deleteCategoryAction(id:string):Promise<ActionStatus>{
 try{const {supabase}=await requirePortfolio();const {error}=await supabase.rpc("delete_project_category",{p_category_id:id});if(error)throw error;refreshContent();revalidatePath("/dashboard/categories");return {ok:true,message:"Category removed. Associated projects are now Uncategorized."};}catch(e){return failure(e);}
}
export async function reorderProjectsAction(ids:string[]):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();if(ids.length>100||new Set(ids).size!==ids.length)throw Error("Invalid project order.");const {error}=await supabase.rpc("reorder_projects",{p_portfolio_id:portfolio.id,p_ids:ids});if(error)throw error;refreshContent();return {ok:true,message:"Project order saved."};}catch(e){return failure(e);}
}

const careerTables={experience:"experience_entries",education:"education_entries",certification:"certifications"} as const;
export async function saveCareerEntryAction(kind:CareerKind,form:FormData):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const id=get(form,"id");
  let item:Record<string,unknown>={portfolio_id:portfolio.id};
  if(kind==="experience"){
   const started_on=validIsoDate(get(form,"started_on"));const current=get(form,"is_current")==="on";
   const ended_on=current?null:validIsoDate(get(form,"ended_on"));ensureDateRange(started_on,ended_on);
   item={...item,organization:text(get(form,"organization"),130),position:text(get(form,"position"),130),location:text(get(form,"location"),120),employment_type:text(get(form,"employment_type"),60),started_on,ended_on,is_current:current,description:text(get(form,"description"),3000)};
   if(!item.organization||!item.position)throw Error("Organization and position are required.");
  }else if(kind==="education"){
   const started_year=validYear(get(form,"started_year"));const ended_year=validYear(get(form,"ended_year"));
   if(started_year&&ended_year&&ended_year<started_year)throw Error("End year must not be before start year.");
   item={...item,institution:text(get(form,"institution"),150),qualification:text(get(form,"qualification"),150),field_of_study:text(get(form,"field_of_study"),130),started_year,ended_year,description:text(get(form,"description"),2000)};
   if(!item.institution||!item.qualification)throw Error("Institution and qualification are required.");
  }else{
   item={...item,name:text(get(form,"name"),150),issuer:text(get(form,"issuer"),130),issued_on:validIsoDate(get(form,"issued_on")),verify_url:safeHttpUrl(get(form,"verify_url")),description:text(get(form,"description"),1200)};
   if(!item.name)throw Error("Enter the certification name.");
   if(get(form,"verify_url")&&!item.verify_url)throw Error("Verification URL must use http or https.");
  }
  const table=careerTables[kind];
  if(id){const {data,error}=await supabase.from(table).update(item).eq("id",id).eq("portfolio_id",portfolio.id).select("id").maybeSingle();if(error)throw error;if(!data)throw Error("Entry not found.");}
  else{const {error}=await supabase.from(table).insert(item);if(error)throw error;}
  revalidatePath("/dashboard/career");refreshContent();return {ok:true,message:"Entry saved."};
 }catch(e){return failure(e);}
}
export async function deleteCareerEntryAction(kind:CareerKind,id:string):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const {data,error}=await supabase.from(careerTables[kind]).delete().eq("id",id).eq("portfolio_id",portfolio.id).select("id").maybeSingle();if(error)throw error;if(!data)throw Error("Entry not found.");revalidatePath("/dashboard/career");return {ok:true,message:"Entry removed."};}catch(e){return failure(e);}
}

export async function saveSkillGroupAction(form:FormData):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const name=text(get(form,"name"),90);const id=get(form,"id");if(!name)throw Error("Enter a skill group name.");
  if(id){const {data,error}=await supabase.from("skill_groups").update({name}).eq("portfolio_id",portfolio.id).eq("id",id).select("id").maybeSingle();if(error)throw error;if(!data)throw Error("Group not found.");}
  else{const {error}=await supabase.from("skill_groups").insert({portfolio_id:portfolio.id,name});if(error)throw error;}
  revalidatePath("/dashboard/skills");return {ok:true,message:"Skill group saved."};
 }catch(e){return failure(e);}
}
export async function deleteSkillGroupAction(id:string):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const {data,error}=await supabase.from("skill_groups").delete().eq("portfolio_id",portfolio.id).eq("id",id).select("id").maybeSingle();if(error)throw error;if(!data)throw Error("Group not found.");revalidatePath("/dashboard/skills");return {ok:true,message:"Group and its skills deleted."};}catch(e){return failure(e);}
}
export async function addSkillAction(groupId:string,name:string):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const skill=text(name,55);if(!skill)throw Error("Enter a skill.");
  const {data:group}=await supabase.from("skill_groups").select("id").eq("id",groupId).eq("portfolio_id",portfolio.id).maybeSingle();if(!group)throw Error("Group not found.");
  const {error}=await supabase.from("skills").insert({portfolio_id:portfolio.id,group_id:groupId,name:skill});if(error)throw error;revalidatePath("/dashboard/skills");return {ok:true,message:"Skill added."};
 }catch(e){return failure(e);}
}
export async function deleteSkillAction(id:string):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const {error}=await supabase.from("skills").delete().eq("portfolio_id",portfolio.id).eq("id",id);if(error)throw error;revalidatePath("/dashboard/skills");return {ok:true,message:"Skill deleted."};}catch(e){return failure(e);}
}

export type UploadIntent=ActionStatus & {storagePath?:string;kind?:"image"|"resume"};
export async function prepareUploadAction(fileName:string,mime:string,size:number):Promise<UploadIntent>{
 try{const {supabase,portfolio,userId}=await requirePortfolio();const accepted=approvedUpload(fileName,mime,size);
  const {count,error:countError}=await supabase.from("media_assets").select("id",{count:"exact",head:true}).eq("portfolio_id",portfolio.id);
  if(countError)throw countError;if((count||0)>=150)throw Error("Media limit reached (150 files). Remove unused assets first.");
  const storagePath=`${userId}/${portfolio.id}/${crypto.randomUUID()}.${accepted.ext}`;
  const {data,error}=await supabase.from("media_assets").insert({portfolio_id:portfolio.id,owner_id:userId,storage_path:storagePath,kind:accepted.kind,file_name:accepted.fileName,mime_type:mime,byte_size:size,alt_text:""}).select("id").single();if(error)throw error;
  return {ok:true,message:"Upload authorized.",id:data.id,storagePath,kind:accepted.kind};
 }catch(e){return failure(e);}
}
export async function confirmUploadAction(id:string):Promise<ActionStatus>{
 try{const {supabase}=await requirePortfolio();const {error}=await supabase.rpc("complete_media_upload",{p_asset_id:id});if(error)throw error;revalidatePath("/dashboard/media");return {ok:true,message:"File uploaded."};}catch(e){return failure(e);}
}
export async function deleteMediaAction(id:string):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const {data:asset}=await supabase.from("media_assets").select("id,storage_path").eq("id",id).eq("portfolio_id",portfolio.id).maybeSingle();if(!asset)throw Error("Asset not found.");
  const {count}=await supabase.from("project_media").select("id",{head:true,count:"exact"}).eq("asset_id",id).eq("portfolio_id",portfolio.id);
  if((count||0)>0)throw Error("Remove the image from its project before deleting the file.");
  const {error:storageError}=await supabase.storage.from("portfolio-drafts").remove([asset.storage_path]);if(storageError)throw storageError;
  const {error}=await supabase.from("media_assets").delete().eq("portfolio_id",portfolio.id).eq("id",id);if(error)throw error;revalidatePath("/dashboard/media");return {ok:true,message:"File removed."};
 }catch(e){return failure(e);}
}
export async function attachProjectImageAction(projectId:string,assetId:string):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const [{data:project},{data:asset},{count}]=await Promise.all([
  supabase.from("projects").select("id").eq("id",projectId).eq("portfolio_id",portfolio.id).maybeSingle(),
  supabase.from("media_assets").select("id").eq("id",assetId).eq("portfolio_id",portfolio.id).eq("kind","image").eq("upload_status","ready").maybeSingle(),
  supabase.from("project_media").select("id",{count:"exact",head:true}).eq("project_id",projectId).eq("portfolio_id",portfolio.id)
 ]);
  if(!project||!asset)throw Error("Choose an uploaded image and your own project.");if((count||0)>=12)throw Error("A project can have up to 12 gallery images.");
  const {error}=await supabase.from("project_media").insert({project_id:projectId,portfolio_id:portfolio.id,asset_id:assetId,is_cover:count===0,sort_order:count});if(error)throw error;
  revalidatePath(`/dashboard/projects/${projectId}`);revalidatePath("/dashboard/media");return {ok:true,message:"Image added to project."};
 }catch(e){return failure(e);}
}
export async function setCoverImageAction(projectId:string,mediaId:string):Promise<ActionStatus>{
 try{const {supabase}=await requirePortfolio();const {error}=await supabase.rpc("set_project_cover",{p_project_id:projectId,p_media_id:mediaId});if(error)throw error;revalidatePath(`/dashboard/projects/${projectId}`);return {ok:true,message:"Cover image updated."};}catch(e){return failure(e);}
}
export async function detachProjectImageAction(projectId:string,mediaId:string):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const {error}=await supabase.from("project_media").delete().eq("id",mediaId).eq("project_id",projectId).eq("portfolio_id",portfolio.id);if(error)throw error;revalidatePath(`/dashboard/projects/${projectId}`);return {ok:true,message:"Image removed from project. Original upload stays in Media Library."};}catch(e){return failure(e);}
}

export async function updateProjectImageAction(projectId:string,imageId:string,alt:string,caption:string):Promise<ActionStatus>{
 try{const {portfolio,supabase}=await requirePortfolio();const {data,error}=await supabase.from("project_media").update({alt_text:text(alt,180),caption:text(caption,240)}).eq("portfolio_id",portfolio.id).eq("project_id",projectId).eq("id",imageId).select("id").maybeSingle();if(error)throw error;if(!data)throw Error("Image not found.");revalidatePath(`/dashboard/projects/${projectId}`);return {ok:true,message:"Image details saved."};}catch(e){return failure(e);}
}
export async function reorderProjectImagesAction(projectId:string,ids:string[]):Promise<ActionStatus>{
 try{const {supabase}=await requirePortfolio();if(ids.length>12||new Set(ids).size!==ids.length)throw Error("Invalid image order.");const {error}=await supabase.rpc("reorder_project_media",{p_project_id:projectId,p_ids:ids});if(error)throw error;revalidatePath(`/dashboard/projects/${projectId}`);return {ok:true,message:"Image order saved."};}catch(e){return failure(e);}
}
