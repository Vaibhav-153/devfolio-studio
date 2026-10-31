import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {hasSupabaseConfig} from "@/lib/config";
export async function requireUser(){
  if(!hasSupabaseConfig())redirect("/setup");
  const supabase=await createClient();
  const {data,error}=await supabase.auth.getClaims();
  if(error||!data?.claims?.sub)redirect("/login");
  return {userId:data.claims.sub,supabase};
}
export async function requirePortfolio(){
 const {supabase,userId}=await requireUser();
 const {data,error}=await supabase.from("portfolios").select("id,owner_id,handle,template,status,active_release_id").eq("owner_id",userId).maybeSingle();
 if(error)throw new Error("Could not load your portfolio: "+error.message);
 if(!data)throw new Error("No portfolio was created for this account. Check that the migration and signup trigger have been installed.");
 return {supabase,userId,portfolio:data};
}
