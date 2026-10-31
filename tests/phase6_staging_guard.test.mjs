import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const script=resolve('scripts/staging-smoke.mjs');
const run=(env)=>spawnSync(process.execPath,[script],{encoding:'utf8',env:{...process.env,...env}});
test('staging destructive script stops before importing network dependencies without opt-in',()=>{
 const result=run({DEVFOLIO_TEST_ENV:'',STAGING_TEST_CONFIRM:''});
 assert.equal(result.status,2);assert.match(result.stderr,/Refusing to run/);assert.doesNotMatch(result.stderr,/ERR_MODULE_NOT_FOUND/);
});
test('staging destructive script rejects mismatch with the actual project reference',()=>{
 const result=run({DEVFOLIO_TEST_ENV:'staging',STAGING_TEST_CONFIRM:'CREATE_AND_DELETE_TEST_USERS',NEXT_PUBLIC_SUPABASE_URL:'https://prod123.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'dummy-public',SUPABASE_SERVICE_ROLE_KEY:'dummy-private',STAGING_SUPABASE_PROJECT_REF:'staging123'});
 assert.equal(result.status,2);assert.match(result.stderr,/must match/);assert.doesNotMatch(result.stderr,/ERR_MODULE_NOT_FOUND/);
});
