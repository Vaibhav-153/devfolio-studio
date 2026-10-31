import type {SupabaseClient} from '@supabase/supabase-js';
import {imageMagicMatches,MAX_PUBLIC_IMAGES,PRIVATE_MEDIA_BUCKET,PUBLIC_MEDIA_BUCKET,publicationPath} from './media';
import {privilegedStorageClient} from './client';

type SourceAsset={id:string;portfolio_id:string;storage_path:string;mime_type:string;kind:string;upload_status:string;byte_size:number};
/** Owner-scoped query; publication actions use the authenticated (RLS-protected) client here. */
export async function findReferencedImages(client:SupabaseClient,portfolioId:string):Promise<SourceAsset[]> {
  const {data:projects,error:projectError}=await client.from('projects').select('id').eq('portfolio_id',portfolioId).eq('visible',true);
  if(projectError)throw projectError;
  if(!projects?.length)return [];
  const {data:relations,error:relationError}=await client.from('project_media').select('asset_id').eq('portfolio_id',portfolioId).in('project_id',projects.map(p=>p.id));
  if(relationError)throw relationError;
  const ids=[...new Set((relations||[]).map(x=>x.asset_id))];
  if(ids.length>MAX_PUBLIC_IMAGES)throw new Error(`Please limit public project images to ${MAX_PUBLIC_IMAGES} for the beta.`);
  if(!ids.length)return [];
  const {data:assets,error:assetError}=await client.from('media_assets').select('id,portfolio_id,storage_path,mime_type,kind,upload_status,byte_size').eq('portfolio_id',portfolioId).in('id',ids);
  if(assetError)throw assetError;
  if(!assets||assets.length!==ids.length||assets.some(a=>a.portfolio_id!==portfolioId||a.kind!=='image'||a.upload_status!=='ready'))throw Error('A referenced project image is missing or has not finished uploading.');
  return assets;
}
/** Copies validated image bytes to an immutable, version-namespaced public path. Never upserts. */
export async function preparePublishedImages(assets:SourceAsset[],portfolioId:string,batchId:string):Promise<string[]> {
  const storage=privilegedStorageClient();
  const staged:string[]=[];
  for(const asset of assets){
    const target=publicationPath(portfolioId,batchId,asset.id,asset.mime_type);
    const {data:source,error:downloadError}=await storage.storage.from(PRIVATE_MEDIA_BUCKET).download(asset.storage_path);
    if(downloadError||!source)throw Error(`Could not read one of the project images: ${downloadError?.message||'missing file'}`);
    const bytes=new Uint8Array(await source.arrayBuffer());
    if(bytes.length!==asset.byte_size||!imageMagicMatches(bytes,asset.mime_type))throw Error('A project image failed file verification. Re-upload it before publishing.');
    const {error}=await storage.storage.from(PUBLIC_MEDIA_BUCKET).upload(target,bytes,{contentType:asset.mime_type,cacheControl:'31536000',upsert:false});
    if(error)throw Error(`Could not prepare a project image: ${error.message}`);
    staged.push(target);
  }
  return staged;
}
