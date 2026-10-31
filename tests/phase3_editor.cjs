const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
let ts;
try {ts=require('typescript')} catch {ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
require.extensions['.ts']=(mod,file)=>{
 const out=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});
 mod._compile(out.outputText,file);
};
const {defaultLayout,exampleSite}=require('../lib/defaults.ts');
const {cleanLayout,cleanSnapshot}=require('../lib/validation.ts');
const {constrainPosition,duplicateSection,editNodePosition,moveSection,moveNodeLayer,templateComposition,makeNode,placeNewFreeformNode}=require('../lib/editor-ops.ts');
function withTwoNodes(){const doc=defaultLayout();const free=doc.blocks.find(b=>b.type==='Freeform');free.props.nodes.push(makeNode('button','action'));return doc;}
test('old Phase 2 layouts continue to validate and contain responsive elements',()=>{
 const old=cleanLayout(defaultLayout());assert.equal(old.schemaVersion,1);assert.equal(old.blocks.find(b=>b.type==='Freeform').props.nodes[0].kind,'note');
});
test('responsive B1 positions are bounded and snapped to a grid',()=>{
 const result=constrainPosition({x:99,y:-4,w:43,h:88});assert.equal(result.x+result.w<=100,true);assert.equal(result.y,0);assert.equal(result.h<=100,true);
 const doc=withTwoNodes();const block=doc.blocks.find(b=>b.type==='Freeform');
 const updated=editNodePosition(doc,block.id,'action','mobile',{x:101,y:91,w:40,h:30});
 const node=updated.blocks.find(b=>b.type==='Freeform').props.nodes.find(n=>n.id==='action');
 assert.ok(node.layout.mobile.x+node.layout.mobile.w<=100);assert.equal(node.layout.desktop.x,8);assert.equal(doc.blocks.find(b=>b.type==='Freeform').props.nodes.find(n=>n.id==='action').layout.mobile.x,6);
});
test('freeform locked elements cannot be moved by editing operations',()=>{
 const doc=withTwoNodes();const block=doc.blocks.find(b=>b.type==='Freeform');block.props.nodes.find(n=>n.id==='action').locked=true;
 const res=editNodePosition(doc,block.id,'action','desktop',{x:50,y:50,w:20,h:20});
 assert.deepEqual(res.blocks.find(b=>b.type==='Freeform').props.nodes.find(n=>n.id==='action').layout.desktop,block.props.nodes.find(n=>n.id==='action').layout.desktop);
});
test('freeform button and image URLs are scrubbed against script injection',()=>{
 const doc=withTwoNodes();const block=doc.blocks.find(b=>b.type==='Freeform');block.props.nodes.find(n=>n.id==='action').href='javascript:alert(1)';
 block.props.nodes.push({...makeNode('image','image1'),src:'data:text/html,hello'});
 const nodes=cleanLayout(doc).blocks.find(b=>b.type==='Freeform').props.nodes;
 assert.equal(nodes.find(n=>n.id==='action').href,'');assert.equal(nodes.find(n=>n.id==='image1').src,'');
});
test('duplicate sections regenerate freeform child identifiers',()=>{
 const doc=withTwoNodes();const block=doc.blocks.find(b=>b.type==='Freeform');
 const result=duplicateSection(doc,block.id,'cloned',['a-unique','b-unique','c-unique']);
 assert.equal(result.blocks.filter(b=>b.type==='Freeform').length,2);
 assert.deepEqual(result.blocks.find(b=>b.id==='cloned').props.nodes.map(x=>x.id),['a-unique','b-unique','c-unique']);
 assert.equal(doc.blocks.length+1,result.blocks.length);
});
test('move sections and freeform layers without losing data',()=>{
 const doc=withTwoNodes();const free=doc.blocks.find(b=>b.type==='Freeform');
 const reordered=moveSection(doc,free.id,0);assert.equal(reordered.blocks[0].id,free.id);
 const layered=moveNodeLayer(doc,free.id,'action',-1);assert.equal(layered.blocks.find(b=>b.id===free.id).props.nodes[1].id,'action');
});
test('template compositions are visually distinct and preserve user project data bindings',()=>{
 const doc=defaultLayout();const list=['minimal','midnight','grid'].map(template=>templateComposition(template,doc,()=>Math.random().toString(16).slice(2)));
 assert.notDeepEqual(list[0].blocks.map(b=>b.type),list[1].blocks.map(b=>b.type));
 assert.notDeepEqual(list[1].blocks.map(b=>b.type),list[2].blocks.map(b=>b.type));
 assert.equal(list[2].blocks.filter(b=>b.type==='ProjectGrid').length,2);
 const snapshot=cleanSnapshot({schemaVersion:1,template:'grid',site:exampleSite,projects:[{id:'x',title:'Real project',slug:'real',category:'AI',summary:'Real summary',tech:['Python'],github:'',demo:''}],pages:[{key:'home',title:'Home',layout:list[2]}]});
 assert.equal(snapshot.projects[0].title,'Real project');
});
test('hidden block and device-specific spacing persist in published layouts',()=>{
 const doc=defaultLayout();doc.blocks[0].hidden=true;doc.blocks[0].style.responsivePadding={desktop:108,tablet:73,mobile:24};
 const cleaned=cleanLayout(doc);assert.equal(cleaned.blocks[0].hidden,true);assert.equal(cleaned.blocks[0].style.responsivePadding.mobile,24);
});
test('new freeform elements choose a non-overlapping desktop slot',()=>{
 const doc=defaultLayout(),nodes=doc.blocks.find(b=>b.type==='Freeform').props.nodes;
 const placed=placeNewFreeformNode(makeNode('label','new-label'),nodes);
 assert.equal(placed.layout.desktop.y,54);
 assert.equal(placed.layout.desktop.x,6);
});
test('duplicate freeform IDs are rejected at validation',()=>{
 const doc=withTwoNodes();doc.blocks.find(b=>b.type==='Freeform').props.nodes.find(n=>n.id==='action').id='idea';
 assert.throws(()=>cleanLayout(doc),/Duplicate freeform/);
});
