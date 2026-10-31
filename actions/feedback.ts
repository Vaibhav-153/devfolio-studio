'use server';
import {revalidatePath} from 'next/cache';
import {requirePortfolio} from '@/lib/auth';
import {validateBetaFeedback} from '@/lib/beta-feedback';
import {logOperationalEvent} from '@/lib/operations';

type FeedbackResult={ok:boolean;message:string};
export async function submitBetaFeedback(fd:FormData):Promise<FeedbackResult>{
 try{
  const input=validateBetaFeedback(Object.fromEntries(fd));
  const {userId,portfolio,supabase}=await requirePortfolio();
  const {error}=await supabase.from('beta_feedback').insert({portfolio_id:portfolio.id,reporter_id:userId,
    kind:input.kind,severity:input.severity,title:input.title,description:input.description,page_path:input.pagePath});
  if(error){logOperationalEvent('beta_feedback_failure',{code:error.code});
   if(error.code==='P0001')return {ok:false,message:'Too many reports in a short period. Please try again later.'};
   return {ok:false,message:'Your report could not be submitted. Please retry.'};
  }
  revalidatePath('/dashboard/feedback');
  return {ok:true,message:'Feedback received. Thank you for helping us improve Devfolio Studio.'};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:'Unable to submit feedback.'};}
}
