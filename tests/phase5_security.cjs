const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
require.extensions['.ts']=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{fileName:filename,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const {getTenantHandle,isUnrecognizedChildHost}=require('../lib/host.ts');
const root='localhost';
test('only valid direct tenant subdomains receive tenant routing',()=>{
  assert.equal(getTenantHandle('alice.localhost:3000'),'alice');
  assert.equal(getTenantHandle('ALICE.LOCALHOST:3000'),'alice');
  assert.equal(getTenantHandle('eve.alice.localhost:3000'),null);
  assert.equal(getTenantHandle('notlocalhost:3000'),null);
  assert.equal(getTenantHandle('admin.localhost:3000'),null);
  assert.equal(isUnrecognizedChildHost('admin.localhost:3000'),true);
  assert.equal(isUnrecognizedChildHost('eve.alice.localhost:3000'),true);
  assert.equal(isUnrecognizedChildHost('alice.localhost:3000'),false);
  assert.equal(isUnrecognizedChildHost('localhost:3000'),false);
});
test('callback redirects use configured app URL not incoming Host',()=>{
  const callback=fs.readFileSync('app/auth/callback/route.ts','utf8');
  assert.ok(callback.includes('appUrl'));
  assert.ok(!callback.includes('new URL("/login?error=callback",origin)'));
});
test('baseline production security headers and rate-limit trigger are present',()=>{
  const next=fs.readFileSync('next.config.ts','utf8');
  for(const key of ['X-Content-Type-Options','X-Frame-Options','Referrer-Policy','Permissions-Policy','Content-Security-Policy-Report-Only'])assert.ok(next.includes(key));
  const sql=fs.readFileSync('supabase/migrations/202610310004_production_hardening.sql','utf8');
  for(const marker of ['check_release_quota','enforce_release_quota','create trigger devfolio_release_quota','pg_advisory_xact_lock'])assert.ok(sql.includes(marker));
  const actions=fs.readFileSync('actions/publishing.ts','utf8');
  assert.ok(actions.includes("supabase.rpc('check_release_quota'"));
});
test('staging smoke cannot execute without an explicit environment guard',()=>{
  const smoke=fs.readFileSync('scripts/staging-smoke.mjs','utf8');
  assert.ok(smoke.includes('DEVFOLIO_TEST_ENV'));
  assert.ok(smoke.includes('CREATE_AND_DELETE_TEST_USERS'));
  assert.ok(smoke.includes('admin.auth.admin.deleteUser'));
});
