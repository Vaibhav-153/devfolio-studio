'use server';
import {revalidatePath} from 'next/cache';
import {requirePortfolio} from '@/lib/auth';
import {findReferencedImages,preparePublishedImages} from '@/lib/publishing/prepare';
import {portfolioPublicUrl} from '@/lib/publishing/urls';
import {validHandle} from '@/lib/validation';
import {logOperationalEvent} from '@/lib/operations';

type ActionResult={ok:boolean;message:string;version?:number;url?:string};
const fail=(message:string):ActionResult=>({ok:false,message});

export async function publishAction():Promise<ActionResult>{
  try{
    const {portfolio,supabase}=await requirePortfolio();
    if(!portfolio.handle||!validHandle(portfolio.handle))return fail('Set a valid website username in Settings before publishing.');
    const [{data:profile,error:profileError},{count,error:countError}]=await Promise.all([
      supabase.from('portfolio_profiles').select('name,role').eq('portfolio_id',portfolio.id).single(),
      supabase.from('projects').select('id',{head:true,count:'exact'}).eq('portfolio_id',portfolio.id).eq('visible',true)
    ]);
    if(profileError||countError)throw new Error('Unable to validate portfolio contents.');
    if(!profile?.name?.trim()||!profile?.role?.trim()||!count)return fail('Add your name, professional role and at least one visible project before publishing.');
    // Cheap owner-scoped DB preflight before potentially expensive media promotion.
    // The database INSERT trigger independently enforces the same quota.
    const {data:allowed,error:quotaError}=await supabase.rpc('check_release_quota',{p_portfolio_id:portfolio.id});
    if(quotaError){logOperationalEvent('publication_rejected',{code:quotaError.code,operation:'quota'});return fail('Publishing is temporarily unavailable. Please try again.');}
    if(allowed!==true)return fail('You can publish or restore up to five releases in ten minutes. Please try later.');
    const images=await findReferencedImages(supabase,portfolio.id);
    const batchId=crypto.randomUUID();
    // Copy all referenced images before the database may activate this release. Public
    // storage is append-only and uses a unique batch path so rollback remains possible.
    // A failed DB commit can leave unreferenced files; never blindly delete on error,
    // because an ambiguous network error might conceal a successful DB commit.
    await preparePublishedImages(images,portfolio.id,batchId);
    const {data,error}=await supabase.rpc('publish_portfolio_v2',{p_portfolio_id:portfolio.id,p_batch_id:batchId});
    if(error){logOperationalEvent('publication_rejected',{code:error.code,operation:'publish'});return fail('Publishing validation failed. Check your project images and try again.');}
    revalidatePath('/dashboard');revalidatePath('/dashboard/publishing');
    return {ok:true,message:`Portfolio version ${Number(data)} is now published.`,version:Number(data),url:portfolioPublicUrl(portfolio.handle)};
  }catch(error){
    logOperationalEvent('publication_failure',{operation:'publish'});
    const msg=error instanceof Error?error.message:'';
    return fail(/image|asset|file|bucket|size|limit|upload|storage|configuration|username/i.test(msg)?msg:'Could not publish. No previous live version was replaced.');
  }
}
export async function unpublishAction():Promise<ActionResult>{
  try{
    const {portfolio,supabase}=await requirePortfolio();
    const {error}=await supabase.rpc('unpublish_portfolio',{p_portfolio_id:portfolio.id});
    if(error)throw error;
    revalidatePath('/dashboard');revalidatePath('/dashboard/publishing');
    return {ok:true,message:'Public portfolio is offline. Your private drafts and release history are retained.'};
  }catch(error){logOperationalEvent('unpublish_failure',{operation:'unpublish'});return fail('Unable to unpublish. Please retry.');}
}
export async function restoreReleaseAction(releaseId:string):Promise<ActionResult>{
  try{
    if(!/^[0-9a-f-]{36}$/i.test(releaseId))return fail('Invalid release.');
    const {portfolio,supabase}=await requirePortfolio();
    const {data,error}=await supabase.rpc('restore_portfolio_release',{p_portfolio_id:portfolio.id,p_source_release_id:releaseId});
    if(error){logOperationalEvent('restore_failure',{code:error.code,operation:'restore'});return fail('Unable to restore that release. It may no longer belong to this portfolio.');}
    revalidatePath('/dashboard');revalidatePath('/dashboard/publishing');
    return {ok:true,message:`Release restored as live version ${Number(data)}.`,version:Number(data),url:portfolio.handle?portfolioPublicUrl(portfolio.handle):undefined};
  }catch(error){logOperationalEvent('restore_failure',{operation:'restore'});return fail('Could not restore the selected version.');}
}
