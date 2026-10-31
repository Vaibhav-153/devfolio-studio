#!/usr/bin/env node
/** Phase 6: read-only HTTPS health and routing checks; no passwords or API keys needed. */
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function allowedBase(input){
 const u=new URL(input);
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw Error('Use a clean origin URL, with no credentials or path.');
 if(u.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(u.hostname))throw Error('Remote deployments must use HTTPS.');
 return u;
}
const headersOk=res=>res.headers.get('x-content-type-options')==='nosniff'&&res.headers.get('x-frame-options')==='DENY';

export async function probeRelease({baseUrl,rootDomain='',publicHandle='',projectSlug='',fetcher=fetch,requestId=randomUUID().slice(0,8)}={}){
 const base=allowedBase(baseUrl);
 const results=[];
 async function check(label,url,predicate){
  try{
   const r=await fetcher(url,{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'Devfolio-Staging-ReadOnly-Probe/1.0'}});
   const result=predicate(r);results.push({label,status:result?'pass':'fail',httpStatus:r.status});
  }catch(error){results.push({label,status:'fail',error:error?.name==='TimeoutError'?'Timeout':'Network or TLS error'});}
 }
 const route=path=>new URL(path,base);
 await check('Marketing website',route('/'),r=>r.status===200&&headersOk(r));
 await check('Liveness',route('/health'),r=>r.status===200&&headersOk(r));
 await check('Database readiness',route('/health/ready'),r=>r.status===200&&headersOk(r)&&r.headers.get('cache-control')?.includes('no-store'));
 await check('Anonymous dashboard protection',route('/dashboard'),r=>[301,302,303,307,308,401,403].includes(r.status)&&r.status!==200);
 await check('Missing portfolio returns 404',route(`/p/phase6-not-real-${requestId}`),r=>r.status===404);
 if(publicHandle){
  if(!/^[a-z][a-z0-9-]{2,29}$/.test(publicHandle))throw Error('Invalid sample handle');
  await check('Published portfolio via root fallback',route(`/p/${publicHandle}`),r=>r.status===200&&headersOk(r));
  if(rootDomain){
   if(base.hostname!==rootDomain)throw Error('Configured root domain must match the deployment URL.');
   const tenant=new URL(base.href);tenant.hostname=`${publicHandle}.${rootDomain}`;
   await check('Wildcard tenant HTTPS',tenant,r=>r.status===200&&headersOk(r));
   const reserved=new URL(base.href);reserved.hostname=`admin.${rootDomain}`;
   await check('Reserved subdomain isolation',reserved,r=>r.status===404);
   if(projectSlug){
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectSlug))throw Error('Invalid project slug');
    const page=new URL(tenant.href);page.pathname=`/projects/${projectSlug}`;
    await check('Published project case study',page,r=>r.status===200&&headersOk(r));
   }
  }
 }
 const summary={pass:results.filter(r=>r.status==='pass').length,fail:results.filter(r=>r.status==='fail').length};
 return {results,summary,ok:summary.fail===0,limited:true,note:'Read-only HTTP smoke checks. Does not verify two-user RLS, file ownership, SMTP, media publication or rollback.'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const baseUrl=process.env.DEVFOLIO_PROBE_URL;
 if(!baseUrl){console.error('Set DEVFOLIO_PROBE_URL to the staging HTTPS root.');process.exit(2);}
 try{
  const r=await probeRelease({baseUrl,rootDomain:process.env.DEVFOLIO_ROOT_DOMAIN||'',publicHandle:process.env.DEVFOLIO_PUBLIC_HANDLE||'',projectSlug:process.env.DEVFOLIO_PROJECT_SLUG||''});
  for(const item of r.results)console.log(`${item.status.toUpperCase().padEnd(5)} ${item.label} ${item.httpStatus||item.error}`);
  console.log(`Read-only probe: ${r.summary.pass} pass, ${r.summary.fail} fail. ${r.note}`);
  if(!r.ok)process.exitCode=1;
 }catch(e){console.error('Probe configuration error:',e.message);process.exitCode=2;}
}
