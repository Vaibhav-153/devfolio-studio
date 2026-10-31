import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";
import {hasSupabaseConfig} from "@/lib/config";

export async function refreshAuth(request:NextRequest){
  if(!hasSupabaseConfig())return NextResponse.next({request});
  let response=NextResponse.next({request});
  const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
    cookies:{getAll(){return request.cookies.getAll()},setAll(toSet){
      toSet.forEach(({name,value})=>request.cookies.set(name,value));
      response=NextResponse.next({request});
      toSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    }}
  });
  await client.auth.getClaims();
  return response;
}
