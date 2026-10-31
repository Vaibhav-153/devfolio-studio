#!/usr/bin/env node
/** Phase 6: local read-only checks. Never displays secret values or contacts a provider. */
import {existsSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const here=resolve(fileURLToPath(new URL('..',import.meta.url)));
const check=(id,state,description,fix)=>({id,state,description,fix});
const configured=(value)=>typeof value==='string'&&value.trim().length>8&&!/^(YOUR|REPLACE|EXAMPLE|CHANGE_ME)/i.test(value.trim());

export function assessRelease({env={},root=here,mode='staging',exists=existsSync,read=readFileSync}={}){
  if(!['staging','production','local'].includes(mode))throw Error('mode must be local, staging or production');
  const checks=[];
  const add=(...args)=>checks.push(check(...args));
  const path=(filename)=>resolve(root,filename);
  const rootDomain=String(env.NEXT_PUBLIC_ROOT_DOMAIN||'').toLowerCase().trim();
  const appUrl=String(env.NEXT_PUBLIC_APP_URL||'').trim();
  const isLocalDomain=['localhost','127.0.0.1',''].includes(rootDomain);
  const hostnameOk=/^(?=.{4,253}$)(?:[a-z0-9]+(?:-[a-z0-9]+)*\.)+[a-z]{2,63}$/.test(rootDomain);
  add('domain',hostnameOk||mode==='local'&&rootDomain==='localhost'?'pass':'pending',
    hostnameOk?'Root domain has a valid hostname shape.':'Configure your registered root domain; no domain ownership is verified by this check.',
    'Set NEXT_PUBLIC_ROOT_DOMAIN to the exact hostname you own (without https://).');

  let parsedApp=null;
  try{parsedApp=new URL(appUrl);}catch{}
  const urlOk=Boolean(parsedApp&&(!['staging','production'].includes(mode)||parsedApp.protocol==='https:')
    &&(mode==='local'||parsedApp.hostname===rootDomain)&&!parsedApp.username&&!parsedApp.password
    &&parsedApp.pathname==='/'&&!parsedApp.search&&!parsedApp.hash);
  add('app-url',urlOk?'pass':'pending',urlOk?'Application URL and environment are consistent.':'Application URL missing, unsafe or not on the configured root domain.',
    'Set NEXT_PUBLIC_APP_URL=https://<root-domain> (or http://localhost:3000 for local development).');

  const sbUrl=env.NEXT_PUBLIC_SUPABASE_URL;
  let sbParsed=null;try{sbParsed=new URL(sbUrl);}catch{}
  const sbOk=Boolean(sbParsed&&sbParsed.protocol==='https:'&&sbParsed.hostname&&sbParsed.username===''&&sbParsed.password==='');
  add('database-url',sbOk?'pass':'pending',sbOk?'HTTPS Supabase endpoint configured.':'A valid HTTPS Supabase endpoint is required.',
    'Configure NEXT_PUBLIC_SUPABASE_URL privately in the deploy environment.');
  const pub=env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const service=env.SUPABASE_SERVICE_ROLE_KEY;
  add('publishable-key',configured(pub)?'pass':'pending',configured(pub)?'Publishable key set.':'Public publishable key missing.',
    'Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY from the project API settings.');
  add('server-key',configured(service)?'pass':'pending',configured(service)?'Server-only credential set.':'Server-only service credential missing.',
    'Set SUPABASE_SERVICE_ROLE_KEY as a server-only secret in Vercel. Never add NEXT_PUBLIC_ to its name.');
  if(configured(pub)&&configured(service)&&pub===service){
    add('key-separation','fail','The public and server-only credentials must not be identical.','Check the Supabase credentials immediately.');
  }else add('key-separation','pass','No identical public/server secret detected.','');

  const manifest=path('package.json'),lock=path('package-lock.json');
  const lockPresent=exists(lock);let lockMatches=false;
  if(lockPresent){
    try{const m=JSON.parse(read(manifest,'utf8'));const l=JSON.parse(read(lock,'utf8'));
      lockMatches=l.name===m.name&&l.packages?.['']?.version===m.version
        &&Object.entries(m.dependencies||{}).every(([name,v])=>l.packages?.['']?.dependencies?.[name]===v);
    }catch{}
  }
  add('lockfile',lockPresent&&lockMatches?'pass':lockPresent?'fail':'pending',
    lockPresent?(lockMatches?'Dependency lockfile matches the project manifest.':'Dependency lockfile does not match package.json.'):'No reproducible dependency lockfile yet.',
    'In a connected Node 22 environment, run npm install, inspect changes and commit package-lock.json.');
  const migrations=['202610310001_initial.sql','202610310002_content_management.sql','202610310003_publishing.sql','202610310004_production_hardening.sql','202610310005_beta_feedback.sql'];
  const missing=migrations.filter(name=>!exists(path(`supabase/migrations/${name}`)));
  add('migrations',missing.length?'fail':'pass',missing.length?'A required SQL migration is missing.':'All required migration files are present.',
    'Apply SQL migrations to a disposable Supabase staging project in filename order.');
  add('ci',exists(path('.github/workflows/ci.yml'))?'pass':'fail','Quality-gate workflow presence checked.',
    'Commit a passing CI workflow in GitHub.');
  add('git',exists(path('.git'))?'pass':'pending',exists(path('.git'))?'Local Git repository detected.':'Code has not been initialized as a Git repository in this copy.',
    'Initialize a private Git repository, review files and push to GitHub.');
  add('hosting',env.VERCEL==='1'?'pass':'pending',env.VERCEL==='1'?'Vercel runtime marker detected.':'Hosting configuration cannot be proven locally.',
    'Connect the repository to a Vercel project and configure its environment variables.');
  return {mode,checks,summary:{pass:checks.filter(x=>x.state==='pass').length,pending:checks.filter(x=>x.state==='pending').length,fail:checks.filter(x=>x.state==='fail').length},
    ready:checks.every(x=>x.state==='pass'),note:'Passing static preflight does not verify database permissions, SSL, DNS, email, backups or live publishing.'};
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=(process.argv.find(x=>x.startsWith('--mode='))||'--mode=staging').split('=')[1];
 const json=process.argv.includes('--json');
 let result;try{result=assessRelease({env:process.env,mode});}catch(error){console.error(String(error.message));process.exit(2);}
 if(json)console.log(JSON.stringify(result,null,2));
 else{
   console.log(`Devfolio Studio Phase 6 preflight (${mode})`);
   for(const item of result.checks)console.log(`${item.state.toUpperCase().padEnd(7)} ${item.id.padEnd(16)} ${item.description}`);
   console.log(`Static preflight: ${result.summary.pass} pass, ${result.summary.pending} pending, ${result.summary.fail} fail`);
   console.log(result.note);
 }
 if(!result.ready)process.exitCode=1;
}
