const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
require.extensions['.ts']=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {validateBetaFeedback}=require('../lib/beta-feedback.ts');
const good={kind:'bug',severity:'normal',title:'A project image is missing',description:'I opened the project editor and could not find the uploaded screenshot.',pagePath:'/dashboard/projects'};
test('accepts a complete private beta report',()=>{assert.deepEqual(validateBetaFeedback(good),good)});
test('rejects short, oversized or empty descriptions',()=>{for(const description of ['short','', 'X'.repeat(3001)])assert.throws(()=>validateBetaFeedback({...good,description}));});
test('rejects arbitrary URL or protocol in page path',()=>{for(const pagePath of ['https://other.site','//example.test','/ok\nattack','/ok\\attack'])assert.throws(()=>validateBetaFeedback({...good,pagePath}));});
test('only known feedback categories and priorities pass',()=>{assert.throws(()=>validateBetaFeedback({...good,kind:'untrusted'}));assert.throws(()=>validateBetaFeedback({...good,severity:'critical'}));});
test('private beta feedback has RLS and explicit rate limit',()=>{const sql=fs.readFileSync('supabase/migrations/202610310005_beta_feedback.sql','utf8');for(const marker of ['enable row level security','feedback_owner_select','feedback_owner_insert','pg_advisory_xact_lock','devfolio_limit_beta_feedback'])assert.ok(sql.includes(marker));});
