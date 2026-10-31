import {createClient} from '@supabase/supabase-js';
import {NextResponse} from 'next/server';
import {logOperationalEvent} from '@/lib/operations';
export const dynamic='force-dynamic';
export const runtime='nodejs';
/** Readiness verifies configuration and the existing anonymous-safe public RPC.
 * An intentionally invalid handle returns null, proving PostgREST can query the DB
 * without exposing owner-scoped tables or service credentials.
 */
export async function GET(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key||!process.env.SUPABASE_SERVICE_ROLE_KEY){
    return NextResponse.json({status:'not_ready'}, {status:503,headers:{'Cache-Control':'no-store'}});
  }
  try{
    const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error}=await client.rpc('get_public_portfolio',{p_handle:'__devfolio_health_probe__'});
    if(error)throw new Error('database check failed');
    return NextResponse.json({status:'ready'}, {headers:{'Cache-Control':'no-store'}});
  }catch{
    logOperationalEvent('readiness_failure',{code:'database_unavailable'});
    return NextResponse.json({status:'not_ready'}, {status:503,headers:{'Cache-Control':'no-store'}});
  }
}
