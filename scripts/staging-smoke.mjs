#!/usr/bin/env node
/** DANGEROUS IF MISCONFIGURED: creates and deletes two synthetic users.
 * Run ONLY on an isolated STAGING Supabase project with explicit opt-in.
 * Never prints tokens, passwords, emails or customer rows.
 */
import {randomUUID} from 'node:crypto';

const required=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SERVICE_ROLE_KEY'];
const missing=required.filter(k=>!process.env[k]);
if(process.env.DEVFOLIO_TEST_ENV!=='staging'||process.env.STAGING_TEST_CONFIRM!=='CREATE_AND_DELETE_TEST_USERS'){
  console.error('Refusing to run. Set DEVFOLIO_TEST_ENV=staging and STAGING_TEST_CONFIRM=CREATE_AND_DELETE_TEST_USERS on a disposable Supabase staging project.');process.exit(2);
}
if(missing.length){console.error('Missing required environment configuration: '+missing.join(', '));process.exit(2);}
// Require the exact staging project reference so a mistakenly supplied production
// URL cannot satisfy this destructive test with only a generic "staging" flag.
const expectedRef=process.env.STAGING_SUPABASE_PROJECT_REF;
let actualRef='';
try{
  const configured=new URL(process.env.NEXT_PUBLIC_SUPABASE_URL||'');
  if(configured.protocol==='https:'&&configured.hostname.endsWith('.supabase.co')) actualRef=configured.hostname.split('.')[0];
}catch{}
if(!expectedRef||!actualRef||expectedRef!==actualRef){
  console.error('Refusing destructive tests: STAGING_SUPABASE_PROJECT_REF must match the actual staging Supabase endpoint.');process.exit(2);
}
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const pub=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
// Import the network client only after destructive-operation safeguards pass.
const {createClient}=await import('@supabase/supabase-js');
const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
const makeAnon=()=>createClient(url,pub,{auth:{persistSession:false,autoRefreshToken:false}});
const created=[];
const checks=[];
const assert=(ok,label)=>{if(!ok)throw Error('FAILED: '+label);checks.push(label);console.log('PASS '+label);};
const throwOn=(response,label)=>{if(response.error)throw Error(`${label}: ${response.error.code||'request_failed'}`);return response.data;};
const suffix=randomUUID().replaceAll('-','').slice(0,16);
const password=`Smoke-${randomUUID()}-A1!`;
const aEmail=`devfolio-smoke-a-${suffix}@example.com`;
const bEmail=`devfolio-smoke-b-${suffix}@example.com`;
const username=`smoke-${suffix.slice(0,12)}`;
try{
  for(const email of [aEmail,bEmail]){
    const result=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{display_name:'Staging Test'}});
    if(result.error||!result.data.user)throw Error('Unable to create staging test user.');
    created.push(result.data.user.id);
  }
  const [a,b]=[makeAnon(),makeAnon()];
  throwOn(await a.auth.signInWithPassword({email:aEmail,password}),'User A sign-in');
  throwOn(await b.auth.signInWithPassword({email:bEmail,password}),'User B sign-in');
  assert(true,'Both authenticated users can sign in');
  const aPortfolios=throwOn(await a.from('portfolios').select('id,owner_id,handle'),'A portfolio query');
  const bPortfolios=throwOn(await b.from('portfolios').select('id,owner_id,handle'),'B portfolio query');
  assert(aPortfolios.length===1&&bPortfolios.length===1&&aPortfolios[0].id!==bPortfolios[0].id,'Each account owns a separate portfolio');
  const aid=aPortfolios[0].id,bid=bPortfolios[0].id;
  const others=throwOn(await b.from('portfolios').select('id').eq('id',aid),'B cross-tenant select');
  assert(others.length===0,'Cross-account portfolio SELECT blocked by RLS');
  const pages=throwOn(await a.from('portfolio_pages').select('id').eq('portfolio_id',aid),'A page query');
  assert(pages.length>0,'Account initialization created portfolio pages');
  const otherDrafts=throwOn(await b.from('page_drafts').select('page_id').eq('page_id',pages[0].id),'B private draft access');
  assert(otherDrafts.length===0,'Cross-account private draft SELECT blocked');
  const forbiddenUpdate=await a.from('portfolios').update({status:'published'}).eq('id',aid);
  assert(Boolean(forbiddenUpdate.error),'Browser cannot directly alter publication status');
  const forbiddenRelease=await a.from('published_releases').insert({portfolio_id:aid,version:1,snapshot_json:{}});
  assert(Boolean(forbiddenRelease.error),'Browser cannot insert releases directly');
  const foreignPublish=await b.rpc('publish_portfolio_v2',{p_portfolio_id:aid,p_batch_id:randomUUID()});
  assert(Boolean(foreignPublish.error),'User B cannot publish User A portfolio');
  const foreignQuota=await b.rpc('check_release_quota',{p_portfolio_id:aid});
  assert(Boolean(foreignQuota.error),'User B cannot read User A publication quota');
  throwOn(await a.from('portfolios').update({handle:username}).eq('id',aid),'Reserve handle');
  throwOn(await a.from('portfolio_profiles').update({name:'Staging QA',role:'Developer'}).eq('portfolio_id',aid),'Update profile');
  throwOn(await a.from('projects').insert({portfolio_id:aid,title:'Test Project',slug:'test-project',category:'Testing',summary:'Staging security test.',visible:true}),'Create project');
  const permitted=throwOn(await a.rpc('check_release_quota',{p_portfolio_id:aid}),'A quota preflight');
  assert(permitted===true,'Owner can publish within quota');
  const v1=throwOn(await a.rpc('publish_portfolio_v2',{p_portfolio_id:aid,p_batch_id:randomUUID()}),'Publish first release');
  assert(Number(v1)===1,'Owner can publish initial version');
  const anon=makeAnon();
  const published=throwOn(await anon.rpc('get_public_portfolio',{p_handle:username}),'Anonymous public read');
  assert(published?.site?.name==='Staging QA','Anonymous visitor sees only published snapshot');
  const anonDrafts=await anon.from('page_drafts').select('page_id');
  assert(Boolean(anonDrafts.error)||!anonDrafts.data?.length,'Anonymous visitors cannot read private drafts');
  const ownerRelease=throwOn(await a.from('published_releases').select('id,version').eq('portfolio_id',aid),'Release history');
  assert(ownerRelease.length===1,'Owner sees release history');
  const bReleases=throwOn(await b.from('published_releases').select('id').eq('portfolio_id',aid),'B release query');
  assert(!bReleases.length,'User B cannot read User A release history');
  const foreignRestore=await b.rpc('restore_portfolio_release',{p_portfolio_id:aid,p_source_release_id:ownerRelease[0].id});
  assert(Boolean(foreignRestore.error),'User B cannot restore User A release');
  throwOn(await a.rpc('unpublish_portfolio',{p_portfolio_id:aid}),'Unpublish');
  const invisible=throwOn(await anon.rpc('get_public_portfolio',{p_handle:username}),'Anonymous read after unpublish');
  assert(invisible===null,'Unpublish removes public snapshot visibility');
  const version2=throwOn(await a.rpc('restore_portfolio_release',{p_portfolio_id:aid,p_source_release_id:ownerRelease[0].id}),'Restore version');
  assert(Number(version2)===2,'Restore creates a new release version');
  // Phase 6: real RLS checks for private feedback. These require migration 005.
  const feedback=throwOn(await a.from('beta_feedback').insert({portfolio_id:aid,reporter_id:created[0],kind:'bug',severity:'normal',title:'Staging test feedback',description:'A synthetic staging-only report that is removed with its account.',page_path:'/dashboard/feedback'}).select('id').single(),'Create own private beta feedback');
  assert(Boolean(feedback.id),'Owner can submit beta feedback');
  const foreignFeedback=throwOn(await b.from('beta_feedback').select('id').eq('id',feedback.id),'Foreign feedback query');
  assert(foreignFeedback.length===0,'Other user cannot read private beta feedback');
  const illicitFeedback=await b.from('beta_feedback').insert({portfolio_id:aid,reporter_id:created[1],kind:'bug',severity:'normal',title:'Unauthorized feedback',description:'This cross-user insert must be denied by RLS.',page_path:'/dashboard/feedback'});
  assert(Boolean(illicitFeedback.error),'Other user cannot attach beta feedback to foreign portfolio');
  const bOwn=throwOn(await b.from('portfolios').select('id').eq('id',bid),'B portfolio remains accessible');
  assert(bOwn.length===1,'Unrelated tenant remains accessible');
  console.log(`STAGING SMOKE PASSED (${checks.length} checks).`);
}catch(error){console.error('STAGING SMOKE FAILED:', error instanceof Error?error.message:'unknown error');process.exitCode=1;}
finally{
  for(const id of created){const {error}=await admin.auth.admin.deleteUser(id);if(error){console.error('WARNING: could not delete a staging test account. Remove it manually.');process.exitCode=1;}}
}
