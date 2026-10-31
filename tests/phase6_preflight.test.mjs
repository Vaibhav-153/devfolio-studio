import test from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {assessRelease} from '../scripts/release-preflight.mjs';

const root='/devfolio-test';
const paths=new Set(['.github/workflows/ci.yml','supabase/migrations/202610310001_initial.sql','supabase/migrations/202610310002_content_management.sql','supabase/migrations/202610310003_publishing.sql','supabase/migrations/202610310004_production_hardening.sql','supabase/migrations/202610310005_beta_feedback.sql','package-lock.json','.git']);
const exists=p=>Array.from(paths).some(x=>p===resolve(root,x));const packageJson=JSON.stringify({name:'devfolio-studio',version:'0.6.0',dependencies:{next:'^16.4.3'}});
const packageLock=JSON.stringify({name:'devfolio-studio',packages:{'':{version:'0.6.0',dependencies:{next:'^16.4.3'}}}});
const read=p=>p.endsWith('package-lock.json')?packageLock:packageJson;
const env={NEXT_PUBLIC_ROOT_DOMAIN:'devfolio.example',NEXT_PUBLIC_APP_URL:'https://devfolio.example',NEXT_PUBLIC_SUPABASE_URL:'https://staging.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_different_value',SUPABASE_SERVICE_ROLE_KEY:'service_role_secret_value',VERCEL:'1'};
const evalState=(e,mode='staging')=>assessRelease({env:e,root,mode,exists,read});
test('valid staging configuration passes static checks, but does not claim a real deployment',()=>{
 const r=evalState(env);assert.equal(r.ready,true);assert.match(r.note,/does not verify/);
});
test('production refuses insecure app URL and localhost root',()=>{
 const r=evalState({...env,NEXT_PUBLIC_ROOT_DOMAIN:'localhost',NEXT_PUBLIC_APP_URL:'http://localhost:3000'},'production');
 assert.equal(r.ready,false);assert.ok(r.checks.find(c=>c.id==='app-url').state==='pending');
});
test('production secret never echoed by a check message',()=>{
 const secret='TOP_SUPER_SECRET_LIVE_TOKEN';const r=evalState({...env,SUPABASE_SERVICE_ROLE_KEY:secret});
 assert.ok(!JSON.stringify(r).includes(secret));
});
test('rejects same public and service key',()=>{
 const r=evalState({...env,SUPABASE_SERVICE_ROLE_KEY:env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY});
 assert.equal(r.checks.find(c=>c.id==='key-separation').state,'fail');
});
test('missing lockfile blocks preflight without pretending to generate it',()=>{
 const r=assessRelease({env,root,mode:'staging',exists:p=>exists(p)&&!p.endsWith('package-lock.json'),read});
 assert.equal(r.checks.find(c=>c.id==='lockfile').state,'pending');assert.equal(r.ready,false);
});
test('malformed lockfile blocks preflight',()=>{
 const r=assessRelease({env,root,mode:'staging',exists,read:p=>p.endsWith('package-lock.json')?'not-json':packageJson});
 assert.equal(r.checks.find(c=>c.id==='lockfile').state,'fail');
});
