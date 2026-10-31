const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
let ts;
try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
require.extensions['.ts']=(mod,path)=>{
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true},fileName:path}).outputText;
 mod._compile(code,path);
};
const {defaultLayout,exampleSite,exampleProjects}=require('../lib/defaults.ts');
const {publicationPath,publicAssetUrl,imageMagicMatches,hydratePublishedSnapshot,safeProjectPath,MAX_PUBLIC_IMAGES}=require('../lib/publishing/media.ts');
const {portfolioPublicUrl,portfolioPreviewPath}=require('../lib/publishing/urls.ts');
const uuid=(n)=>`12345678-1234-4234-8234-${String(n).padStart(12,'0')}`;
const id=uuid(1),batch=uuid(2),asset=uuid(3);
const path=publicationPath(id,batch,asset,'image/webp');

test('publication paths are immutable and scoped to portfolio / batch / asset IDs',()=>{
 assert.equal(path,`${id}/${batch}/${asset}.webp`);
 assert.equal(publicationPath(id,batch,asset,'image/jpeg'),`${id}/${batch}/${asset}.jpg`);
 assert.throws(()=>publicationPath('other',batch,asset,'image/png'));
 assert.throws(()=>publicationPath(id,batch,asset,'image/svg+xml'));
 assert.equal(MAX_PUBLIC_IMAGES,24);
});
test('published URLs are exclusively fixed public-bucket paths',()=>{
 const expected=`https://sample.supabase.co/storage/v1/object/public/portfolio-public/${path}`;
 assert.equal(publicAssetUrl('https://sample.supabase.co',path),expected);
 assert.equal(publicAssetUrl('https://sample.supabase.co','https://bad.example/cross-tenant.png'),'');
 assert.equal(publicAssetUrl('https://sample.supabase.co','../private/secret.png'),'');
 assert.equal(publicAssetUrl('https://sample.supabase.co',`${id}/${batch}/${asset}.svg`),'');
 assert.equal(publicAssetUrl('javascript:alert(1)',path),'');
 assert.equal(publicAssetUrl('not a URL',path),'');
});
test('image header checks block wrong types, SVG and oversized files',()=>{
 const png=Uint8Array.from([137,80,78,71,13,10,26,10,1,2,3,4]);
 const jpg=Uint8Array.from([255,216,255,0,1,2,3,4,5,6,255,217]);
 const webp=Uint8Array.from([...Buffer.from('RIFF'),1,2,3,4,...Buffer.from('WEBP')]);
 assert.ok(imageMagicMatches(png,'image/png'));assert.ok(imageMagicMatches(jpg,'image/jpeg'));assert.ok(imageMagicMatches(webp,'image/webp'));
 assert.equal(imageMagicMatches(png,'image/jpeg'),false);
 assert.equal(imageMagicMatches(Buffer.from('<svg onload=alert(1)>'),'image/png'),false);
 assert.equal(imageMagicMatches(new Uint8Array(5*1024*1024+1),'image/png'),false);
});
test('snapshot hydration promotes only validated namespaced images',()=>{
 const project={...exampleProjects[0],id:'sample-1',coverUrl:'https://untrusted.example/image.png',coverPath:path,gallery:[{path,alt:'Dashboard screenshot',caption:'Overview'},{path:'https://hostile.example/secret',alt:'Bad',caption:''}]};
 const raw={schemaVersion:1,template:'minimal',site:exampleSite,projects:[project],pages:[{key:'home',title:'Home',layout:defaultLayout()}]};
 const result=hydratePublishedSnapshot(raw,'https://sample.supabase.co');
 assert.ok(result);assert.equal(result.projects[0].coverUrl,publicAssetUrl('https://sample.supabase.co',path));
 assert.equal(result.projects[0].gallery.length,1);assert.equal(result.projects[0].gallery[0].alt,'Dashboard screenshot');
 assert.equal(result.projects[0].github,project.github);
});
test('unknown schema does not hydrate and invalid project paths are rejected',()=>{
 assert.equal(hydratePublishedSnapshot({schemaVersion:99},'https://sample.supabase.co'),null);
 assert.equal(safeProjectPath('an-incredible-project'),'an-incredible-project');
 assert.equal(safeProjectPath('../admin'),null);
 assert.equal(safeProjectPath('project%2fsecret'),null);
});
test('deployment URLs and authenticated preview paths are stable',()=>{
 assert.equal(portfolioPreviewPath('home'),'/preview/home');
 assert.equal(portfolioPreviewPath('projects'),'/preview/projects');
 assert.equal(portfolioPublicUrl('alex'),'http://localhost:3000/p/alex');
});
