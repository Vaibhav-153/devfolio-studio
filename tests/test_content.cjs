const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const Module=require('node:module');
const path=require('node:path');
// Uses TypeScript from devDependencies; no Next.js or network needed.
const ts=require('typescript');
const f=path.join(__dirname,'../lib/content.ts');
const source=fs.readFileSync(f,'utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod=new Module(f,module);mod.filename=f;mod.paths=module.paths;mod._compile(js,f);
const {parseGitHubRepoUrl,approvedUpload,slugify,validIsoDate,validYear,ensureDateRange}=mod.exports;

test('public GitHub repository URLs are normalized',()=>{
 assert.deepEqual(parseGitHubRepoUrl('https://github.com/OpenAI/example-project.git'),{owner:'OpenAI',repo:'example-project',url:'https://github.com/OpenAI/example-project'});
});
test('repository parser rejects SSRF, branch links, credentials and non-HTTPS',()=>{
 for(const candidate of ['http://github.com/foo/bar','https://github.com.evil.com/a/b','https://github.com/a/b/tree/main','https://github.com/@a/b','https://evil.com/a/b','https://github.com/a/b?x=1']){
  assert.throws(()=>parseGitHubRepoUrl(candidate),candidate);
 }
});
test('image and resume uploads have strict size and MIME restrictions',()=>{
 assert.deepEqual(approvedUpload('image.PNG','image/png',100).kind,'image');
 assert.equal(approvedUpload('cv.pdf','application/pdf',10240).kind,'resume');
 for(const type of ['text/html','image/svg+xml','application/javascript'])assert.throws(()=>approvedUpload('file',type,50));
 assert.throws(()=>approvedUpload('huge.png','image/png',5242881));
 assert.throws(()=>approvedUpload('empty.png','image/png',0));
});
test('upload filenames remove directory separators',()=>{
 assert.equal(approvedUpload('../my/file.png','image/png',10).fileName,'.._my_file.png');
});
test('date inputs reject impossible dates and reverse timelines',()=>{
 assert.equal(validIsoDate('2026-02-28'),'2026-02-28');
 assert.throws(()=>validIsoDate('2026-02-30'));
 assert.throws(()=>validYear('1900'));
 assert.throws(()=>ensureDateRange('2026-10-01','2026-09-30'));
});
test('category slugs are stable',()=>{
 assert.equal(slugify(' AI / Data Analytics  '),'ai-data-analytics');
 assert.equal(slugify('Full Stack!'),'full-stack');
});
