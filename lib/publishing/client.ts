import {createClient} from '@supabase/supabase-js';
/** Server-only Storage client: never import into a Client Component or expose the key in NEXT_PUBLIC variables. */
export function privilegedStorageClient(){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error('Publishing storage is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
