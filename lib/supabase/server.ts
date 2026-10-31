import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
export async function createClient(){
  const jar=await cookies();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw new Error("Supabase configuration is missing.");
  return createServerClient(url,key,{
    cookies:{getAll(){return jar.getAll()},setAll(toSet){try{toSet.forEach(({name,value,options})=>jar.set(name,value,options))}catch{/* Server Components cannot set cookies: proxy handles refresh */}}}
  });
}
