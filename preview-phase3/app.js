(()=>{'use strict';
const KEY='devfolio.phase3.visualstudio.v1';
const DEVICE=['desktop','tablet','mobile'];
const TYPES=['Hero','ProjectGrid','About','Skills','Text','Image','Freeform','Experience','Education','Certifications','Contact'];
const LABELS={Hero:'Hero',ProjectGrid:'Projects',About:'About',Skills:'Skills',Text:'Text section',Image:'Image',Freeform:'Freeform canvas',Experience:'Experience',Education:'Education',Certifications:'Certifications',Contact:'Contact'};
const GLYPHS={Hero:'H.',ProjectGrid:'▦',About:'Aa',Skills:'S',Text:'T',Image:'▧',Freeform:'⊞',Experience:'Ex',Education:'Ed',Certifications:'✓',Contact:'@'};
const ESC={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'};
const escape=(s)=>String(s??'').replace(/[&<>"']/g,c=>ESC[c]);
const copy=(o)=>JSON.parse(JSON.stringify(o));
const uid=()=>crypto.randomUUID?crypto.randomUUID():'node-'+Date.now()+'-'+Math.random().toString(16).slice(2);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,Number(n)||0));
const safeLink=(raw)=>{try{if(!raw)return'';const url=new URL(String(raw));return ['https:','http:'].includes(url.protocol)?url.href:''}catch{return''}};
const saveStatus=document.getElementById('saveStatus');
const toastEl=document.getElementById('toast');let toastTimer=null;
function toast(text){toastEl.textContent=text;toastEl.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.hidden=true,3200)}
const position=(x,y,w,h)=>({x,y,w,h});
const starter={schemaVersion:1,template:'minimal',site:{name:'Alex Morgan',role:'Full-stack developer',heroOne:'Building thoughtful',heroTwo:'digital experiences.',intro:'I turn product ideas into practical, accessible web applications—from the first wireframe to a reliable release.',about:'I enjoy building useful products, clear interfaces and dependable systems. My work combines frontend design, backend engineering and thoughtful problem-solving.',email:'hello@example.com',github:'https://github.com/',linkedin:'https://linkedin.com/',skills:['TypeScript','React','Next.js','Node.js','PostgreSQL','APIs']},projects:[{id:'project-1',title:'Flowboard',slug:'flowboard',category:'Full-stack',summary:'A team planning interface for transforming scattered tasks into organized workflows.',tech:['Next.js','PostgreSQL','TypeScript'],github:'',demo:''},{id:'project-2',title:'Insight Kit',slug:'insight-kit',category:'Analytics',summary:'A clearer dashboard experience for exploring trends and making informed decisions.',tech:['React','Python','SQL'],github:'',demo:''},{id:'project-3',title:'Notes API',slug:'notes-api',category:'Backend',summary:'A documented REST API focused on reliability, testing and clean data handling.',tech:['Node.js','Docker','REST'],github:'',demo:''}],layout:{schemaVersion:1,blocks:[
{id:'hero',type:'Hero',props:{},style:{paddingY:68,surface:'plain'}},
{id:'projects',type:'ProjectGrid',props:{title:'Selected work',maxProjects:3,columns:2},style:{paddingY:66,surface:'plain'}},
{id:'about',type:'About',props:{},style:{paddingY:62,surface:'soft'}},
{id:'skills',type:'Skills',props:{},style:{paddingY:64,surface:'plain'}},
{id:'freeform',type:'Freeform',props:{title:'My process',height:{desktop:330,tablet:340,mobile:420},nodes:[{id:'first',kind:'note',text:'Start with the problem',tone:'light',locked:false,hidden:false,layout:{desktop:position(5,11,36,32),tablet:position(6,11,42,31),mobile:position(6,7,88,23)}},{id:'second',kind:'note',text:'Build with intention',tone:'accent',locked:false,hidden:false,layout:{desktop:position(49,43,44,30),tablet:position(48,46,44,30),mobile:position(6,38,88,23)}},{id:'third',kind:'button',text:'Explore my work',href:'https://github.com/',tone:'dark',locked:false,hidden:false,layout:{desktop:position(52,12,28,19),tablet:position(51,12,35,20),mobile:position(6,73,88,15)}}]},style:{paddingY:66,surface:'soft'}},
{id:'contact',type:'Contact',props:{},style:{paddingY:75,surface:'plain'}}]}};
const presetOrder={minimal:['Hero','ProjectGrid','About','Skills','Freeform','Contact'],midnight:['Hero','Skills','ProjectGrid','Freeform','About','Contact'],grid:['Hero','ProjectGrid','ProjectGrid','About','Skills','Freeform','Contact']};
const newNode=(kind)=>({id:uid(),kind,text:{note:'A new thought',label:'BUILT TO LAST',button:'Visit project',image:'Image'}[kind],tone:kind==='button'?'dark':'light',src:'',href:'',alt:'',locked:false,hidden:false,layout:{desktop:position(9,12,kind==='label'?30:40,kind==='label'?18:28),tablet:position(7,12,44,27),mobile:position(6,8,88,22)}});
const newBlock=(type)=>({id:uid(),type,props:type==='Text'?{eyebrow:'THE DETAILS',title:'A thoughtful heading',body:'Write something worth sharing.'}:type==='ProjectGrid'?{title:'Featured projects',maxProjects:6,columns:2}:type==='Image'?{src:'',alt:'',caption:''}:type==='Freeform'?{title:'A flexible section',height:{desktop:350,tablet:350,mobile:440},nodes:[newNode('note')]}:{},style:{paddingY:60,surface:'plain',textAlign:'left',contentWidth:'default',responsivePadding:{}}});
function cleanPosition(v){const p=v||{},w=clamp(p.w,12,100),h=clamp(p.h,10,100);return{x:clamp(p.x,0,100-w),y:clamp(p.y,0,100-h),w,h}}
function cleanDocument(input){if(!input||typeof input!=='object')throw Error('Invalid draft file');
 const o=input.layout?input:{layout:input,template:'minimal',site:starter.site,projects:starter.projects};
 const raw=o.layout;if(raw?.schemaVersion!==1||!Array.isArray(raw.blocks)||raw.blocks.length>60)throw Error('Unsupported layout');
 const ids=new Set();const blocks=raw.blocks.map(b=>{
 if(!b||!TYPES.includes(b.type)||!b.id||ids.has(b.id))throw Error('Invalid or duplicate section');ids.add(b.id);
 const s=b.style||{},p=b.props||{};
 const style={surface:['plain','soft','contrast'].includes(s.surface)?s.surface:'plain',paddingY:clamp(s.paddingY??55,0,140),textAlign:['left','center'].includes(s.textAlign)?s.textAlign:'left',contentWidth:['default','narrow','wide'].includes(s.contentWidth)?s.contentWidth:'default',responsivePadding:{}};
 DEVICE.forEach(d=>style.responsivePadding[d]=clamp(s.responsivePadding?.[d]??style.paddingY,0,140));
 const props={};
 if(b.type==='Text'){['eyebrow','title','body'].forEach(k=>props[k]=String(p[k]||'').slice(0,k==='body'?1800:160));}
 if(b.type==='ProjectGrid'){props.title=String(p.title||'Selected work').slice(0,100);props.columns=clamp(p.columns??2,1,3);props.maxProjects=clamp(p.maxProjects??6,1,36);}
 if(b.type==='Image'){props.src=safeLink(p.src);props.alt=String(p.alt||'').slice(0,180);props.caption=String(p.caption||'').slice(0,180);}
 if(b.type==='Freeform'){
  props.title=String(p.title||'My process').slice(0,100);props.height={};DEVICE.forEach(d=>props.height[d]=clamp(p.height?.[d]??350,d==='mobile'?280:200,1100));
  const nodeIds=new Set();props.nodes=(Array.isArray(p.nodes)?p.nodes:[]).slice(0,25).map(n=>{
   if(!n||!n.id||nodeIds.has(n.id))throw Error('Invalid or duplicate element ID');nodeIds.add(n.id);
   const layout={};DEVICE.forEach(d=>layout[d]=cleanPosition(n.layout?.[d]||n.layout?.desktop||position(8,10,42,25)));
   return{id:String(n.id).slice(0,64),kind:['note','label','button','image'].includes(n.kind)?n.kind:'note',text:String(n.text||'').slice(0,160),tone:['light','dark','accent'].includes(n.tone)?n.tone:'light',src:safeLink(n.src),href:safeLink(n.href),alt:String(n.alt||'').slice(0,180),hidden:n.hidden===true,locked:n.locked===true,layout};
  });
 }
 return{id:String(b.id).slice(0,64),type:b.type,hidden:b.hidden===true,style,props};
 });
 const site={};for(const key of Object.keys(starter.site)){const val=o.site?.[key]??starter.site[key];site[key]=Array.isArray(val)?val.slice(0,60).map(x=>String(x).slice(0,50)):String(val).slice(0,2500)};
 site.github=safeLink(site.github);site.linkedin=safeLink(site.linkedin);
 const projects=(Array.isArray(o.projects)?o.projects:starter.projects).slice(0,100).map(x=>({id:String(x.id||uid()).slice(0,64),title:String(x.title||'Untitled').slice(0,120),slug:String(x.slug||'').slice(0,120),category:String(x.category||'Development').slice(0,60),summary:String(x.summary||'').slice(0,1800),tech:(Array.isArray(x.tech)?x.tech:[]).slice(0,30).map(s=>String(s).slice(0,40)),github:safeLink(x.github),demo:safeLink(x.demo),coverUrl:safeLink(x.coverUrl),visible:x.visible!==false,featured:x.featured===true}));
 return{schemaVersion:1,template:['minimal','midnight','grid'].includes(o.template)?o.template:'minimal',site,projects,layout:{schemaVersion:1,blocks}};
}
let draft=cleanDocument(starter),publication=null,device='desktop',tab='blocks',selectedBlock=null,selectedNode=null,preview=false,showPublished=false,snapGrid=true;
let history=[copy(draft)],historyIndex=0,savingHandle=null;
try{const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(stored?.draft){draft=cleanDocument(stored.draft);history=[copy(draft)];publication=stored.publication?cleanDocument(stored.publication):null;}}catch{/* fresh start */}
const $=(id)=>document.getElementById(id);
const activeBlock=()=>draft.layout.blocks.find(b=>b.id===selectedBlock);
const activeNode=()=>activeBlock()?.props.nodes?.find(n=>n.id===selectedNode);
const scheduleSave=()=>{saveStatus.textContent='Saving locally…';clearTimeout(savingHandle);savingHandle=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify({draft,publication}));saveStatus.textContent='Saved locally'}catch{saveStatus.textContent='Browser storage full'}},280)};
function commit(fn){fn(draft);draft=cleanDocument(draft);history=history.slice(0,historyIndex+1);history.push(copy(draft));if(history.length>80)history.shift();historyIndex=history.length-1;scheduleSave();render();}
function historyChange(step){const n=historyIndex+step;if(n<0||n>=history.length)return;historyIndex=n;draft=copy(history[n]);scheduleSave();render();}
function selectBlock(id){selectedBlock=id;selectedNode=null;render();}
function selectNode(blockId,nodeId){selectedBlock=blockId;selectedNode=nodeId;render();}
function field(label,value,attrs={}){const {name='',type='text',kind='',small='',min='',max='',options=null,rows=0}=attrs;const data=kind==='site'?`data-site-key="${escape(name)}"`:kind==='node'?`data-node-key="${escape(name)}"`:kind==='style'?`data-style-key="${escape(name)}"`:kind==='prop'?`data-prop-key="${escape(name)}"`:kind==='pos'?`data-position-key="${escape(name)}"`:'';
 let control=options?`<select ${data}>${options.map(opt=>`<option value="${escape(opt[0])}" ${String(value)===String(opt[0])?'selected':''}>${escape(opt[1])}</option>`).join('')}</select>`:rows?`<textarea ${data} rows="${rows}">${escape(value)}</textarea>`:`<input ${data} type="${type}" value="${escape(value)}" ${min!==''?`min="${min}"`:''} ${max!==''?`max="${max}"`:''} ${type==='range'?'step="2"':''}/>`;
 return `<label class="form-field"><span>${escape(label)}</span>${control}${small?`<small>${escape(small)}</small>`:''}</label>`;}
function sectionBlocks(){return `<div><h3 class="side-section-title">Components</h3><p class="side-desc">Click to insert, or drag between sections.</p><span class="side-label">PAGE BUILDING BLOCKS</span><div class="block-grid">${TYPES.map(type=>`<button draggable="true" data-block-type="${type}" data-action="add-block" class="block-item"><span class="block-glyph">${GLYPHS[type]}</span>${LABELS[type]}</button>`).join('')}</div><div class="help-panel"><strong>Design tip</strong><p>Choose a professionally designed starting point and adjust only the details that make your portfolio distinctive.</p></div></div>`;}
function sectionLayers(){return `<h3 class="side-section-title">Page structure</h3><p class="side-desc">Select, reorder, or hide page sections.</p><div class="layer-list">${draft.layout.blocks.map((b,i)=>`<div class="layer-row ${selectedBlock===b.id?'selected':''} ${b.hidden?'hidden-layer':''}"><button class="layer-select" data-action="select-block" data-id="${escape(b.id)}">${String(i+1).padStart(2,'0')} · ${LABELS[b.type]}</button><div class="layer-controls"><button data-action="block-up" data-id="${escape(b.id)}" ${i===0?'disabled':''}>Up</button><button data-action="block-down" data-id="${escape(b.id)}" ${i===draft.layout.blocks.length-1?'disabled':''}>Down</button><button data-action="toggle-block" data-id="${escape(b.id)}">${b.hidden?'Show':'Hide'}</button></div></div>`).join('')}</div>`;}
function sectionContent(){return `<h3 class="side-section-title">Your information</h3><p class="side-desc">This content automatically updates every matching section.</p>${field('Full name',draft.site.name,{kind:'site',name:'name'})}${field('Professional role',draft.site.role,{kind:'site',name:'role'})}${field('Hero first line',draft.site.heroOne,{kind:'site',name:'heroOne'})}${field('Hero second line',draft.site.heroTwo,{kind:'site',name:'heroTwo'})}${field('Introduction',draft.site.intro,{kind:'site',name:'intro',rows:3})}${field('About',draft.site.about,{kind:'site',name:'about',rows:4})}${field('Contact email',draft.site.email,{kind:'site',name:'email'})}${field('GitHub URL',draft.site.github,{kind:'site',name:'github'})}<span class="side-label">PROJECT CONTENT</span>${field('Featured project name',draft.projects[0]?.title||'',{kind:'site',name:'projectTitle'})}${field('Featured project summary',draft.projects[0]?.summary||'',{kind:'site',name:'projectSummary',rows:3})}<p class="side-desc">Full account-backed project editing is in the Phase 2 dashboard, not this local design demo.</p>`;}
function sectionDesign(){return `<h3 class="side-section-title">Templates & styles</h3><p class="side-desc">All your content stays the same when you switch styles.</p>${[['minimal','Signature Minimal','Warm, clean and editorial.'],['midnight','Midnight Developer','Confident, dark and technical.'],['grid','Grid Studio','Project-first modular composition.']].map(([key,title,desc])=>`<button data-action="theme" data-template="${key}" class="template-option ${draft.template===key?'active':''}"><span class="swatch ${key}"><i></i><i></i><i></i></span><span><strong>${title}</strong><small>${desc}</small></span></button>`).join('')}<button class="small-button wide" style="margin-top:12px" data-action="apply-preset">Apply selected layout preset</button><div class="help-panel"><strong>Layout safety</strong><p>Applying a preset rearranges the page, but never erases your saved projects or professional profile. Undo is available.</p></div>`;}
function renderSide(){document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('sideBody').innerHTML=({blocks:sectionBlocks,layers:sectionLayers,content:sectionContent,design:sectionDesign})[tab]();}
function renderInspector(){const block=activeBlock(),node=activeNode();$('inspectorHeading').textContent=block?LABELS[block.type]:'Choose an element';$('inspectorHint').textContent=block?'Select settings below. Changes are saved as a private draft.':'Select a section on the canvas to edit its appearance.';if(!block){$('inspectorBody').innerHTML='<div class="help-panel"><strong>How to begin</strong><p>Open Blocks, add a section, and select it on the canvas to customize. Freeform sections offer individual draggable elements.</p></div>';return;}
 let html=`<div class="inspector-group">SECTION DESIGN</div><label class="checker"><input type="checkbox" data-block-visibility ${!block.hidden?'checked':''}/> Visible when published</label>`+
 field('Background',block.style.surface,{kind:'style',name:'surface',options:[['plain','Clean surface'],['soft','Soft background'],['contrast','High contrast']]})+
 field('Content width',block.style.contentWidth||'default',{kind:'style',name:'contentWidth',options:[['default','Standard'],['narrow','Narrow'],['wide','Full width']]})+
 field('Alignment',block.style.textAlign||'left',{kind:'style',name:'textAlign',options:[['left','Left'],['center','Centered']]})+
 field(`Spacing · ${device}`,block.style.responsivePadding?.[device]??block.style.paddingY,{kind:'style',name:'paddingY',type:'range',min:0,max:140});
 if(block.type==='Text'){html+=`<div class="inspector-group">TEXT CONTENT</div>`+field('Eyebrow',block.props.eyebrow,{kind:'prop',name:'eyebrow'})+field('Heading',block.props.title,{kind:'prop',name:'title'})+field('Paragraph',block.props.body,{kind:'prop',name:'body',rows:4});}
 if(block.type==='ProjectGrid'){html+=`<div class="inspector-group">PROJECTS</div>`+field('Section title',block.props.title,{kind:'prop',name:'title'})+field('Grid columns',block.props.columns,{kind:'prop',name:'columns',options:[[1,'1 column'],[2,'2 columns'],[3,'3 columns']]})+field('Projects shown',block.props.maxProjects,{kind:'prop',name:'maxProjects',type:'number',min:1,max:36});}
 if(block.type==='Image'){html+=`<div class="inspector-group">IMAGE</div>`+field('Image URL',block.props.src,{kind:'prop',name:'src'})+field('Accessible alt text',block.props.alt,{kind:'prop',name:'alt'})+field('Caption',block.props.caption,{kind:'prop',name:'caption'});}
 if(block.type==='Freeform'){
 html+=`<div class="inspector-group">RESPONSIVE CANVAS</div>`+field(`Stage height · ${device}`,block.props.height?.[device],{kind:'prop',name:'height',type:'number',min:200,max:1100})+field('Section heading',block.props.title,{kind:'prop',name:'title'})+
 `<div class="inspector-group">ADD ELEMENT</div><div class="inline-pair">${['note','label','button','image'].map(k=>`<button class="small-button" data-action="add-node" data-kind="${k}">${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div>`+
 `<div class="inspector-group">ELEMENT LAYERS</div><div>${block.props.nodes.map((n,i)=>`<div class="element-layer-row ${n.id===selectedNode?'selected':''}"><button class="node-select" data-action="select-node" data-id="${escape(n.id)}">${String(i+1).padStart(2,'0')} · ${escape(n.text)}</button><button data-action="lock-node" data-id="${escape(n.id)}">${n.locked?'Unlock':'Lock'}</button></div>`).join('')}</div>`;
 if(node){html+=`<hr class="inspector-divider"/><div class="inspector-group">${node.kind.toUpperCase()} ELEMENT</div>`;
  if(node.kind!=='image')html+=field('Element text',node.text,{kind:'node',name:'text',rows:2});
  if(node.kind==='image')html+=field('Image URL',node.src,{kind:'node',name:'src'})+field('Alt text',node.alt,{kind:'node',name:'alt'});
  if(node.kind==='button')html+=field('External URL',node.href,{kind:'node',name:'href'});
  html+=field('Colour style',node.tone,{kind:'node',name:'tone',options:[['light','Soft'],['dark','Dark'],['accent','Accent']]})+
   `<div class="pos-grid">${['x','y','w','h'].map(k=>field(`${k.toUpperCase()} %`,node.layout[device][k],{kind:'pos',name:k,type:'number',min:0,max:100})).join('')}</div>`+
   `<p class="side-desc">Use arrow keys to nudge a selected element. Hold Shift to move further.</p><div class="element-actions"><button class="small-button" data-action="layer-back">Send back</button><button class="small-button" data-action="layer-front">Bring forward</button></div><div class="element-actions"><button class="small-button" data-action="duplicate-node">Duplicate</button><button class="small-button" data-action="toggle-node">${node.hidden?'Show':'Hide'}</button><button class="small-button" data-action="lock-node" data-id="${escape(node.id)}">${node.locked?'Unlock':'Lock'}</button><button class="small-button danger" data-action="delete-node">Remove</button></div>`;
 }
 }
 html+=`<hr class="inspector-divider"/><div class="element-actions"><button class="small-button" data-action="duplicate-block">Duplicate section</button><button class="small-button danger" data-action="delete-block">Delete section</button></div>`;
 $('inspectorBody').innerHTML=html;
}
function pHeader(name){const initials=String(name||'DF').trim().split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase();return `<header class="p-nav"><div class="p-logo">${escape(initials)}<b>.</b></div><div class="p-nav-links"><a href="#projects">Projects</a><a href="#contact">Contact</a></div></header>`;}
function pCard(project,i){const tech=project.tech||[];const cover=safeLink(project.coverUrl);return `<article class="p-card"><div class="p-card-art">${cover?`<img alt="${escape(project.title)} cover" src="${escape(cover)}" loading="lazy"/>`:''}<span>${String(i+1).padStart(2,'0')}</span>${!cover?`<span>◌ ◇</span>`:''}</div><div class="p-card-body"><h3>${escape(project.title)}</h3><p>${escape(project.summary)}</p><div class="p-tags">${tech.slice(0,6).map(t=>`<span>${escape(t)}</span>`).join('')}</div></div></article>`;}
function pBlock(block,data,isEditing,selected){const p=block.props||{},site=data.site,projects=data.projects;let result='';const cnt=(x)=>`<div class="p-container">${x}</div>`;
 switch(block.type){
 case 'Hero':result=cnt(`<div class="p-hero"><div><div class="p-eyebrow">THOUGHTFUL ENGINEERING / 2026</div><p class="intro-name">Hi, I'm ${escape(site.name)}.</p><h1>${escape(site.heroOne)}<br/><span>${escape(site.heroTwo)}</span></h1><p>${escape(site.intro)}</p><a class="p-primary" href="#projects">Explore my work</a></div><div class="p-hero-art"><div class="p-art-overline">BUILD · LEARN · SHIP</div><div class="p-art-circle">From ideas<br/>to impact.</div><div class="p-art-small one"><i>01 / DISCOVER</i>Understand the problem</div><div class="p-art-small two"><i>02 / DELIVER</i>Build thoughtfully</div></div></div>`);break;
 case 'ProjectGrid':{const count=Math.min(36,Number(p.maxProjects)||6),cols=Math.min(3,Number(p.columns)||2);const displayed=projects.filter(x=>x.visible!==false).slice(0,count);result=cnt(`<div class="p-head"><div><div class="p-eyebrow">SELECTED PROJECTS</div><h2>${escape(p.title||'Selected work')}</h2></div><p>Practical applications, experiments and ideas brought to life.</p></div><div class="p-cards cols-${cols}">${displayed.map(pCard).join('')}</div>`);break;}
 case 'About':result=cnt(`<div class="p-about"><div><div class="p-eyebrow">ABOUT ME</div><h2>Curiosity meets<br/>practical engineering.</h2></div><p>${escape(site.about)}</p></div>`);break;
 case 'Skills':result=cnt(`<div class="p-head"><div><div class="p-eyebrow">EXPERTISE</div><h2>Tools I work with.</h2></div><p>Technical tools and approaches I use to make things work.</p></div><div class="p-skills">${site.skills.map(s=>`<span class="skill-chip">${escape(s)}</span>`).join('')}</div>`);break;
 case 'Text':result=cnt(`<div class="p-text"><div class="p-eyebrow">${escape(p.eyebrow)}</div><h2>${escape(p.title)}</h2><p>${escape(p.body)}</p></div>`);break;
 case 'Image':result=cnt(`<div class="p-image">${safeLink(p.src)?`<img src="${escape(safeLink(p.src))}" alt="${escape(p.alt)}" loading="lazy"/>`:'<div class="image-placeholder">Add a photo URL from the properties panel</div>'}${p.caption?`<small>${escape(p.caption)}</small>`:''}</div>`);break;
 case 'Contact':result=cnt(`<div class="p-contact"><div class="p-eyebrow">LET'S CONNECT</div><h2>Have an interesting<br/>problem to solve?</h2><p>I'm open to thoughtful projects, meaningful collaborations and the next challenge.</p>${/^\S+@\S+\.\S+$/.test(site.email)?`<a class="p-primary" href="mailto:${escape(site.email)}">Get in touch</a>`:''}</div>`);break;
 case 'Freeform':{
  const height=p.height||{desktop:350,tablet:350,mobile:430};const notes=(p.nodes||[]).filter(n=>!n.hidden||isEditing).map((n,i)=>{
   const l=n.layout||{},d=l.desktop||position(8,8,40,30),t=l.tablet||d,m=l.mobile||d;
   const styles=`--dx:${d.x}%;--dy:${d.y}%;--dw:${d.w}%;--dh:${d.h}%;--tx:${t.x}%;--ty:${t.y}%;--tw:${t.w}%;--th:${t.h}%;--mx:${m.x}%;--my:${m.y}%;--mw:${m.w}%;--mh:${m.h}%;z-index:${i+1}`;
   let inner=n.kind==='image'?(safeLink(n.src)?`<img alt="${escape(n.alt)}" src="${escape(safeLink(n.src))}"/>`:'<span class="p-img-placeholder">Image appears here</span>'):n.kind==='button'?`<span class="p-btn">${escape(n.text)}</span>`:`<em>${n.kind==='label'?'DETAIL':String(i+1).padStart(2,'0')}</em><strong>${escape(n.text)}</strong>`;
   if(n.kind==='button'&&safeLink(n.href)&&!isEditing)inner=`<a href="${escape(safeLink(n.href))}" target="_blank" rel="noopener noreferrer" class="p-btn">${escape(n.text)}</a>`;
   return `<div data-node="${escape(n.id)}" data-block="${escape(block.id)}" data-kind="${escape(n.kind||'note')}" class="p-note tone-${escape(n.tone||'light')} ${selected===n.id?'is-selected':''} ${n.hidden?'is-hidden':''} ${n.locked?'is-locked':''}" style="${styles}" ${isEditing?'tabindex="0" role="button"':''}>${inner}${isEditing?(n.locked?'<span class="p-locked">Locked</span>':'<span class="p-resize" data-resize="true"></span>'):''}</div>`;
  }).join('');
  result=cnt(`<div class="p-head"><div><div class="p-eyebrow">YOUR CREATIVE CANVAS</div><h2>${escape(p.title||'My approach')}</h2></div><p>Built by positioning and styling your own elements.</p></div><div class="p-free-stage ${isEditing?'editing':''}" style="--hd:${height.desktop}px;--ht:${height.tablet}px;--hm:${height.mobile}px">${notes}</div>`);break;
 }
 default:result=cnt(`<div class="p-head"><div><div class="p-eyebrow">YOUR JOURNEY</div><h2>${LABELS[block.type]}</h2></div><p>Connect this section to your Phase 2 content dashboard when your account is configured.</p></div>`);
 }
 const s=block.style||{},pad=s.responsivePadding||{};
 return `<section data-block="${escape(block.id)}" class="p-section ${s.surface==='soft'?'soft':s.surface==='contrast'?'contrast':''} ${block.hidden&&isEditing?'hide-in-editor':''} ${s.textAlign==='center'?'center':''} ${s.contentWidth||'default'} ${selectedBlock===block.id&&isEditing?'selected':''}" style="--p-desktop:${pad.desktop??s.paddingY??60}px;--p-tablet:${pad.tablet??s.paddingY??48}px;--p-mobile:${pad.mobile??s.paddingY??36}px">${isEditing?`<button class="p-block-handle" data-action="select-block" data-id="${escape(block.id)}" draggable="true" data-move-block="${escape(block.id)}">Move section</button>`:''}${result}</section>`;
}
function renderPortfolio(){const target=showPublished&&publication?publication:draft;
 const edit=!preview&&!showPublished;
 const blocks=target.layout.blocks.filter(b=>edit||!b.hidden);
 const markup=blocks.map((b,i)=>`${edit?`<div class="p-insert" data-drop-index="${i}">Drop section here</div>`:''}${pBlock(b,target,edit,selectedNode)}`).join('')+ (edit?`<div class="p-insert" data-drop-index="${blocks.length}">Drop section here</div>`:'');
 $('portfolioRoot').innerHTML=`<div class="portfolio ${target.template} ${edit?'is-editing':''}">${pHeader(target.site.name)}${markup}<footer id="contact" class="p-footer"><span>${escape(target.site.name)}</span><span>Created with Devfolio Studio</span></footer></div>`;
 $('editorGrid').classList.toggle('is-preview',preview||showPublished);
 $('canvasHeading').textContent=showPublished?'Local published snapshot':preview?'Portfolio preview':'Visual canvas';
}
function render(){document.querySelectorAll('[data-device]').forEach(b=>b.classList.toggle('active',b.dataset.device===device));
 $('canvasPaper').className='canvas-paper '+(device==='desktop'?'':device);
 $('viewportLabel').textContent=`${device[0].toUpperCase()+device.slice(1)} / ${{desktop:1100,tablet:820,mobile:390}[device]}px`;
 $('undo').disabled=historyIndex===0;$('redo').disabled=historyIndex>=history.length-1;
 $('previewToggle').textContent=(preview||showPublished)?'Edit layout':'Preview';
 $('snapToggle').textContent=`Snap grid: ${snapGrid?'On':'Off'}`;$('snapToggle').classList.toggle('active',snapGrid);
 $('viewPublished').disabled=!publication;$('viewPublished').textContent=showPublished?'Return to draft':'View local publication';
 renderSide();renderInspector();renderPortfolio();}
function shiftBlock(id,delta){const i=draft.layout.blocks.findIndex(x=>x.id===id),j=i+delta;if(i<0||j<0||j>=draft.layout.blocks.length)return;commit(s=>{[s.layout.blocks[i],s.layout.blocks[j]]=[s.layout.blocks[j],s.layout.blocks[i]]});}
function moveToIndex(id,index){const i=draft.layout.blocks.findIndex(x=>x.id===id);if(i<0)return;commit(s=>{const [b]=s.layout.blocks.splice(i,1);s.layout.blocks.splice(index>i?index-1:index,0,b);});}
function modifyBlock(fn){const id=selectedBlock;if(!id)return;commit(s=>{const block=s.layout.blocks.find(x=>x.id===id);if(block)fn(block)});}
function modifyNode(fn){if(!selectedNode)return;modifyBlock(b=>{const n=b.props.nodes?.find(x=>x.id===selectedNode);if(n)fn(n)})}
function modifyNodeLayer(delta){const id=selectedNode;if(!id)return;modifyBlock(b=>{const ns=b.props.nodes||[],i=ns.findIndex(x=>x.id===id),j=i+delta;if(i>=0&&j>=0&&j<ns.length)[ns[i],ns[j]]=[ns[j],ns[i]]});}
function duplicateBlock(){const id=selectedBlock,i=draft.layout.blocks.findIndex(b=>b.id===id);if(i<0)return;let newId;commit(s=>{const b=copy(s.layout.blocks[i]);newId=uid();b.id=newId;if(b.props.nodes)b.props.nodes.forEach(n=>n.id=uid());s.layout.blocks.splice(i+1,0,b)});selectedBlock=newId;render();}
function insertBlock(type,index){if(!TYPES.includes(type))return;const b=newBlock(type);commit(s=>s.layout.blocks.splice(index??s.layout.blocks.length,0,b));selectedBlock=b.id;selectedNode=null;render();}
function applyPreset(){if(!confirm('Apply this layout preset? Use Undo to recover your old arrangement. Projects and profile will not be changed.'))return;
 commit(s=>{const pool={};s.layout.blocks.forEach(b=>(pool[b.type]??=[]).push(copy(b)));s.layout.blocks=presetOrder[s.template].map(type=>pool[type]?.shift()||newBlock(type));if(s.template==='grid'){s.layout.blocks.filter(b=>b.type==='ProjectGrid').forEach((b,i)=>{b.props.title=i===0?'Featured projects':'More projects';b.props.maxProjects=i===0?2:6;b.props.columns=i===0?2:3;});}});
 selectedBlock=null;selectedNode=null;tab='layers';render();}
function runAction(action,button){const id=button.dataset.id||selectedBlock;
 switch(action){
 case 'add-block':insertBlock(button.dataset.blockType);break;
 case 'select-block':selectBlock(id);break;
 case 'select-node':selectNode(selectedBlock,button.dataset.id);break;
 case 'block-up':shiftBlock(id,-1);break;
 case 'block-down':shiftBlock(id,1);break;
 case 'toggle-block':commit(s=>{const b=s.layout.blocks.find(x=>x.id===id);if(b)b.hidden=!b.hidden});break;
 case 'duplicate-block':duplicateBlock();break;
 case 'delete-block':if(!confirm('Delete this section? You can restore it with Undo.'))return;commit(s=>s.layout.blocks=s.layout.blocks.filter(x=>x.id!==selectedBlock));selectedBlock=null;selectedNode=null;render();break;
 case 'theme':commit(s=>s.template=button.dataset.template);break;
 case 'apply-preset':applyPreset();break;
 case 'add-node':{const node=newNode(button.dataset.kind);const prev=activeBlock()?.props.nodes||[];
   const occupied=(candidate,which)=>prev.some(n=>{const q=n.layout[which];const x=Math.max(0,Math.min(candidate.x+candidate.w,q.x+q.w)-Math.max(candidate.x,q.x));const y=Math.max(0,Math.min(candidate.y+candidate.h,q.y+q.h)-Math.max(candidate.y,q.y));return x*y>candidate.w*candidate.h*.1});
   const slots={desktop:[[6,54,38,26],[52,72,40,22],[54,9,37,28],[7,9,39,27]],tablet:[[6,60,42,28],[51,64,43,26],[52,9,42,28],[6,9,42,27]],mobile:[[6,84,88,14],[6,62,88,18],[6,5,88,22],[6,30,88,23],[6,53,88,20]]};
   DEVICE.forEach(which=>{for(const [x,y,w,h] of slots[which]){const candidate={x,y,w,h};if(!occupied(candidate,which)){node.layout[which]=candidate;break;}}});
   modifyBlock(b=>{if(b.type==='Freeform')b.props.nodes.push(node)});selectedNode=node.id;render();break;}
 case 'delete-node':modifyBlock(b=>b.props.nodes=b.props.nodes.filter(n=>n.id!==selectedNode));selectedNode=null;render();break;
 case 'duplicate-node':{const n=activeNode();if(!n)return;const cp=copy(n);cp.id=uid();DEVICE.forEach(d=>{const p=cp.layout[d];cp.layout[d]=cleanPosition({...p,x:p.x+4,y:p.y+4})});modifyBlock(b=>{const i=b.props.nodes.findIndex(x=>x.id===n.id);b.props.nodes.splice(i+1,0,cp)});selectedNode=cp.id;render();break;}
 case 'toggle-node':modifyNode(n=>n.hidden=!n.hidden);break;
 case 'lock-node':{const key=button.dataset.id;const chosen=activeBlock()?.props.nodes?.find(n=>n.id===key);if(chosen)modifyBlock(b=>{const n=b.props.nodes.find(x=>x.id===key);n.locked=!n.locked});break;}
 case 'layer-back':modifyNodeLayer(-1);break;
 case 'layer-front':modifyNodeLayer(1);break;
 }
}
document.addEventListener('click',e=>{
 const btn=e.target.closest('[data-action]');if(btn&&(!btn.closest('.p-free-stage')||btn.matches('.p-block-handle'))){if(showPublished||preview){if(btn.dataset.action!=='select-block')return;}runAction(btn.dataset.action,btn);return;}
 const tb=e.target.closest('[data-tab]');if(tb){tab=tb.dataset.tab;renderSide();return;}
 const db=e.target.closest('[data-device]');if(db){device=db.dataset.device;render();return;}
 const section=e.target.closest('.p-section[data-block]');if(section&&!preview&&!showPublished&&!e.target.closest('.p-note')){selectBlock(section.dataset.block);return;}
 const note=e.target.closest('.p-note[data-node]');if(note&&!preview&&!showPublished){selectNode(note.dataset.block,note.dataset.node);return;}
});
document.addEventListener('change',e=>{
 const el=e.target;
 if(el.matches('[data-block-visibility]')){modifyBlock(b=>b.hidden=!el.checked);return;}
 const sKey=el.dataset.siteKey;if(sKey){commit(s=>{if(sKey==='projectTitle'&&s.projects[0])s.projects[0].title=el.value;else if(sKey==='projectSummary'&&s.projects[0])s.projects[0].summary=el.value;else if(['github','linkedin'].includes(sKey))s.site[sKey]=safeLink(el.value);else s.site[sKey]=el.value});return;}
 const styleKey=el.dataset.styleKey;if(styleKey){modifyBlock(b=>{if(styleKey==='paddingY'){b.style.responsivePadding??={};b.style.responsivePadding[device]=clamp(el.value,0,140)}else b.style[styleKey]=el.value});return;}
 const propKey=el.dataset.propKey;if(propKey){modifyBlock(b=>{if(propKey==='height'){b.props.height[device]=clamp(el.value,200,1100)}else if(['columns','maxProjects'].includes(propKey))b.props[propKey]=Number(el.value);else if(propKey==='src')b.props[propKey]=safeLink(el.value);else b.props[propKey]=el.value});return;}
 const nodeKey=el.dataset.nodeKey;if(nodeKey){modifyNode(n=>{n[nodeKey]=['href','src'].includes(nodeKey)?safeLink(el.value):el.value});return;}
 const posKey=el.dataset.positionKey;if(posKey){modifyNode(n=>{n.layout[device]=cleanPosition({...n.layout[device],[posKey]:Number(el.value)})});return;}
});
$('undo').onclick=()=>historyChange(-1);$('redo').onclick=()=>historyChange(1);
$('previewToggle').onclick=()=>{if(showPublished){showPublished=false;preview=false}else preview=!preview;render();};
$('snapToggle').onclick=()=>{snapGrid=!snapGrid;render()};
$('reset').onclick=()=>{if(!confirm('Reset the browser demo to its original content and layout?'))return;draft=cleanDocument(starter);history=[copy(draft)];historyIndex=0;selectedBlock=null;selectedNode=null;preview=false;showPublished=false;publication=null;localStorage.removeItem(KEY);scheduleSave();render();toast('Local demo reset');};
$('publish').onclick=()=>{if(!confirm('Create a local published snapshot? This will not deploy a public website.'))return;publication=copy(draft);showPublished=false;preview=false;scheduleSave();render();toast('Local published snapshot created');};
$('viewPublished').onclick=()=>{if(!publication)return;showPublished=!showPublished;preview=false;render();};
$('downloadDraft').onclick=()=>{const text=JSON.stringify(draft,null,2),url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='devfolio-studio-phase3-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);toast('Draft exported as JSON')};
$('importDraft').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>1024*1024){toast('Maximum JSON import size is 1 MB');return;}try{const parsed=cleanDocument(JSON.parse(await file.text()));if(!confirm('Replace your draft with the imported design?'))return;draft=parsed;history=[copy(draft)];historyIndex=0;selectedBlock=null;selectedNode=null;preview=false;showPublished=false;scheduleSave();render();toast('Draft imported successfully')}catch(err){toast(`Import rejected: ${err.message}`)}});
// HTML5 native drag between sections plus accessible Up/Down layer buttons.
document.addEventListener('dragstart',e=>{
 const lib=e.target.closest('[data-block-type]'),moving=e.target.closest('[data-move-block]');
 if(lib){e.dataTransfer.setData('devfolio/type',lib.dataset.blockType);e.dataTransfer.effectAllowed='copy'}
 else if(moving){e.dataTransfer.setData('devfolio/move',moving.dataset.moveBlock);e.dataTransfer.effectAllowed='move'}
});
document.addEventListener('dragover',e=>{const t=e.target.closest('[data-drop-index]');if(t){e.preventDefault();t.classList.add('drag-over')}});
document.addEventListener('dragleave',e=>{const t=e.target.closest('[data-drop-index]');if(t)t.classList.remove('drag-over')});
document.addEventListener('drop',e=>{const t=e.target.closest('[data-drop-index]');if(!t)return;e.preventDefault();t.classList.remove('drag-over');const index=Number(t.dataset.dropIndex),type=e.dataTransfer.getData('devfolio/type'),id=e.dataTransfer.getData('devfolio/move');if(type)insertBlock(type,index);else if(id)moveToIndex(id,index);});
// Freeform B1: percentage based, bounded, optional 2% snapping, per device overrides.
let gesture=null;
document.addEventListener('pointerdown',e=>{
 const el=e.target.closest('.p-note[data-node]');if(!el||preview||showPublished||e.button!==0)return;
 const b=draft.layout.blocks.find(b=>b.id===el.dataset.block),n=b?.props.nodes?.find(n=>n.id===el.dataset.node);if(!n)return;
 selectedBlock=b.id;selectedNode=n.id;
 if(n.locked){e.stopPropagation();renderInspector();return;}
 const stage=el.closest('.p-free-stage'),rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;
 e.preventDefault();e.stopPropagation();
 gesture={el,bid:b.id,nid:n.id,device,rect,initial:copy(n.layout[device]),startX:e.clientX,startY:e.clientY,next:copy(n.layout[device]),resize:!!e.target.closest('[data-resize]'),moved:false};
 renderInspector();
});
document.addEventListener('pointermove',e=>{
 const g=gesture;if(!g)return;
 const dx=(e.clientX-g.startX)/g.rect.width*100,dy=(e.clientY-g.startY)/g.rect.height*100;
 if(Math.abs(dx)+Math.abs(dy)>.3)g.moved=true;
 const grid=x=>snapGrid?Math.round(x/2)*2:x;const p=copy(g.initial);
 if(g.resize){p.w=clamp(grid(g.initial.w+dx),12,100-p.x);p.h=clamp(grid(g.initial.h+dy),10,100-p.y)}
 else{p.x=clamp(grid(g.initial.x+dx),0,100-p.w);p.y=clamp(grid(g.initial.y+dy),0,100-p.h)}
 g.next=p;Object.assign(g.el.style,{left:p.x+'%',top:p.y+'%',width:p.w+'%',height:p.h+'%'});
});
function endGesture(cancelled){if(!gesture)return;const g=gesture;gesture=null;if(cancelled||!g.moved){render();return;}commit(s=>{const n=s.layout.blocks.find(b=>b.id===g.bid)?.props.nodes?.find(n=>n.id===g.nid);if(n&&!n.locked)n.layout[g.device]=cleanPosition(g.next)});}
document.addEventListener('pointerup',()=>endGesture(false));document.addEventListener('pointercancel',()=>endGesture(true));
document.addEventListener('keydown',e=>{
 const tag=e.target?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag)||e.target?.isContentEditable)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();historyChange(e.shiftKey?1:-1);return;}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();historyChange(1);return;}
 const deltas={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};const delta=deltas[e.key];if(!delta||preview||showPublished||!activeNode()||activeNode().locked)return;
 e.preventDefault();const step=e.shiftKey?4:2;modifyNode(n=>{const old=n.layout[device];n.layout[device]=cleanPosition({...old,x:old.x+delta[0]*step,y:old.y+delta[1]*step})});
});
// Edit & public preview are deliberately generated by the same renderer.
render();
})();
