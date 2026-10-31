import {createClient} from '@supabase/supabase-js';
import {validHandle} from '@/lib/validation';
import {hydratePublishedSnapshot} from './media';
export async function readPublishedPortfolio(handle:string){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key||!validHandle(handle))return null;
 const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await supabase.rpc('get_public_portfolio',{p_handle:handle});
 if(error||!data)return null;
 return hydratePublishedSnapshot(data,url);
}
