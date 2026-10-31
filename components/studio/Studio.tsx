"use client";
import {useCallback,useEffect,useRef,useState,type DragEvent as ReactDragEvent,type PointerEvent as ReactPointerEvent} from "react";
import Link from "next/link";
import {PortfolioRenderer} from "@/components/portfolio/PortfolioRenderer";
import {saveLayoutAction} from "@/actions/portfolio";
import {defaultLayout,exampleProjects,exampleSite,templateOptions} from "@/lib/defaults";
import {cleanLayout,cleanSite,cleanProject} from "@/lib/validation";
import {duplicateSection,makeNode,moveNodeLayer,templateComposition,constrainPosition,placeNewFreeformNode} from "@/lib/editor-ops";
import type {Block,BlockType,Device,LayoutDocument,PortfolioProject,SiteContent,TemplateName,FreeformNode} from "@/lib/models";
import type {ExperienceEntry,EducationEntry,CertificationEntry,SkillGroup} from "@/lib/content";

type Props={demo?:boolean;pageId?:string;pageKey?:string;initialLayout:LayoutDocument;initialRevision?:number;site:SiteContent;projects:PortfolioProject[];template:TemplateName;experience?:ExperienceEntry[];education?:EducationEntry[];certifications?:CertificationEntry[];skillGroups?:SkillGroup[];handle?:string|null};
const labels:Record<BlockType,string>={Hero:"Hero",ProjectGrid:"Project grid",About:"About",Skills:"Skills",Text:"Text",Image:"Image",Contact:"Contact",Freeform:"Freeform section",Experience:"Experience",Education:"Education",Certifications:"Certifications"};
const groups:BlockType[]=["Hero","Text","ProjectGrid","About","Skills","Image","Freeform","Experience","Education","Certifications","Contact"];
const snap=(x:number)=>Math.round(x/2)*2;
const clamp=(x:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,x));
const makeBlock=(type:BlockType):Block=>({id:crypto.randomUUID(),type,props:type==="Text"?{eyebrow:"YOUR STORY",title:"A thoughtful heading",body:"Write something worth sharing."}:type==="ProjectGrid"?{title:"Featured projects",columns:2,maxProjects:6}:type==="Freeform"?{title:"How I work",height:{desktop:330,tablet:320,mobile:390},nodes:[{id:crypto.randomUUID(),text:"Start with curiosity",layout:{desktop:{x:6,y:10,w:40,h:30},tablet:{x:6,y:10,w:45,h:30},mobile:{x:6,y:8,w:88,h:28}}}]}:type==="Image"?{src:"",alt:"",caption:""}:{},style:{paddingY:55,surface:"plain"}});
const copy=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const pick=(obj:Record<string,unknown>,key:string,defaultValue="")=>typeof obj[key]==="string"?obj[key] as string:defaultValue;

export function Studio({demo=false,pageId="",pageKey="home",initialLayout,initialRevision=0,site,projects,template,experience=[],education=[],certifications=[],skillGroups=[],handle}:Props){
 const [layout,setLayout]=useState<LayoutDocument>(initialLayout);
 const [theme,setTheme]=useState<TemplateName>(template);
 const [siteData,setSiteData]=useState<SiteContent>(site);
 const [projectData,setProjectData]=useState<PortfolioProject[]>(projects);
 const [selected,setSelected]=useState<string|null>(null);
 const [selectedNode,setSelectedNode]=useState<string|null>(null);
 const [tab,setTab]=useState<"blocks"|"layers"|"content"|"design">("blocks");
 const [device,setDevice]=useState<Device>("desktop");
 const [preview,setPreview]=useState(false);
 const [snapEnabled,setSnapEnabled]=useState(true);
 const [status,setStatus]=useState("Saved");
 const [loaded,setLoaded]=useState(!demo);
 const [histTick,setHistTick]=useState(0);
 const [historyControls,setHistoryControls]=useState({canUndo:false,canRedo:false});
 const hist=useRef<LayoutDocument[]>([initialLayout]);const pointer=useRef(0);
 const lastSaved=useRef(JSON.stringify(initialLayout));const latest=useRef(JSON.stringify(initialLayout));const rev=useRef(initialRevision);const saving=useRef(false);
 const currentBlock=layout.blocks.find(x=>x.id===selected)||null;
 const activeNodes=(currentBlock?.props.nodes as FreeformNode[]|undefined)||[];
 const currentNode=activeNodes.find(n=>n.id===selectedNode)||null;
 const {canUndo,canRedo}=historyControls;
 const updateLayout=useCallback((next:LayoutDocument)=>{
   const valid=cleanLayout(next);hist.current=hist.current.slice(0,pointer.current+1);hist.current.push(valid);if(hist.current.length>55)hist.current.shift();pointer.current=hist.current.length-1;
   setLayout(valid);setHistTick(t=>t+1);setHistoryControls({canUndo:pointer.current>0,canRedo:false});
 },[]);
 function mutate(fn:(d:LayoutDocument)=>void){const d=copy(layout);fn(d);updateLayout(d)}
 function undo(){if(pointer.current===0)return;pointer.current-=1;setLayout(copy(hist.current[pointer.current]));setHistTick(t=>t+1);setHistoryControls({canUndo:pointer.current>0,canRedo:pointer.current<hist.current.length-1})}
 function redo(){if(pointer.current>=hist.current.length-1)return;pointer.current+=1;setLayout(copy(hist.current[pointer.current]));setHistTick(t=>t+1);setHistoryControls({canUndo:pointer.current>0,canRedo:pointer.current<hist.current.length-1})}
 function addBlock(type:BlockType,index?:number){const block=makeBlock(type);mutate(doc=>doc.blocks.splice(index??doc.blocks.length,0,block));setSelected(block.id);setSelectedNode(null);}
 function changeBlock(id:string,fn:(b:Block)=>void){mutate(doc=>{const b=doc.blocks.find(x=>x.id===id);if(b)fn(b)})}
 function swapBlock(id:string,direction:number){const idx=layout.blocks.findIndex(b=>b.id===id);const next=idx+direction;if(next<0||next>=layout.blocks.length)return;mutate(d=>{[d.blocks[idx],d.blocks[next]]=[d.blocks[next],d.blocks[idx]]});}
 function deleteBlock(id:string){mutate(d=>{d.blocks=d.blocks.filter(b=>b.id!==id)});setSelected(null);setSelectedNode(null)}
 function changeNode(blockId:string,nodeId:string,fn:(n:FreeformNode)=>void){changeBlock(blockId,b=>{const n=(b.props.nodes as FreeformNode[]).find(x=>x.id===nodeId);if(n)fn(n);});}
 function addFreeformNode(blockId:string,kind:NonNullable<FreeformNode["kind"]>){const initial=(layout.blocks.find(b=>b.id===blockId)?.props.nodes||[]) as FreeformNode[];const node=placeNewFreeformNode(makeNode(kind,crypto.randomUUID()),initial);changeBlock(blockId,b=>{(b.props.nodes as FreeformNode[]).push(node)});setSelectedNode(node.id);}
 function changeNodeLayer(blockId:string,nodeId:string,offset:number){updateLayout(moveNodeLayer(layout,blockId,nodeId,offset));}
 function duplicateNode(blockId:string,nodeId:string){const node=(layout.blocks.find(b=>b.id===blockId)?.props.nodes as FreeformNode[]|undefined)?.find(n=>n.id===nodeId);if(!node)return;const id=crypto.randomUUID();changeBlock(blockId,b=>{const items=b.props.nodes as FreeformNode[],index=items.findIndex(n=>n.id===nodeId);const copied=copy(items[index]);copied.id=id;for(const device of ["desktop","tablet","mobile"] as Device[]){copied.layout[device]=constrainPosition({...copied.layout[device],x:copied.layout[device].x+4,y:copied.layout[device].y+4})}items.splice(index+1,0,copied)});setSelectedNode(id);}
 function applyPreset(){if(!confirm("Apply this template's layout? Existing page arrangement is kept in Undo history, and portfolio content is never deleted."))return;updateLayout(templateComposition(theme,layout,()=>crypto.randomUUID()));setSelected(null);setSelectedNode(null);setTab("layers");}
 function duplicateBlock(id:string){const idx=layout.blocks.findIndex(b=>b.id===id);if(idx<0)return;const newId=crypto.randomUUID();updateLayout(duplicateSection(layout,id,newId,(layout.blocks[idx].props.nodes as FreeformNode[]|undefined)?.map(()=>crypto.randomUUID())));setSelected(newId)}
 function dropBlock(e:ReactDragEvent<HTMLDivElement>,index:number){e.preventDefault();const type=e.dataTransfer.getData("devfolio/block") as BlockType;const moving=e.dataTransfer.getData("devfolio/moving");
  if(groups.includes(type)){addBlock(type,index);return}if(moving){const old=layout.blocks.findIndex(x=>x.id===moving);if(old<0)return;mutate(d=>{const [b]=d.blocks.splice(old,1);d.blocks.splice(index>old?index-1:index,0,b)});setSelected(moving)}
 }
 // A separate local mode lets visitors test all editing actions without pretending to have an account.
 useEffect(()=>{
  if(!demo)return;
  let active=true;
  queueMicrotask(()=>{
   if(!active)return;
   try{const raw=localStorage.getItem("devfolio.phase3.demo.v1");if(raw){const stored=JSON.parse(raw) as Record<string,unknown>;
    const saved=cleanLayout(stored.layout);setLayout(saved);hist.current=[saved];pointer.current=0;lastSaved.current=JSON.stringify(saved);
    setHistoryControls({canUndo:false,canRedo:false});
    if(["minimal","midnight","grid"].includes(String(stored.template)))setTheme(stored.template as TemplateName);
    if(stored.site)setSiteData(cleanSite(stored.site));if(Array.isArray(stored.projects))setProjectData(stored.projects.slice(0,100).map(cleanProject));
   }}catch{/* Invalid local data falls back to example */}
   setLoaded(true);
  });
  return ()=>{active=false};
 },[demo]);
 useEffect(()=>{latest.current=JSON.stringify(layout);if(!loaded)return;
   let active=true;const reportStatus=(text:string)=>queueMicrotask(()=>{if(active)setStatus(text)});
   if(demo){reportStatus("Saving locally…");const t=setTimeout(()=>{try{localStorage.setItem("devfolio.phase3.demo.v1",JSON.stringify({layout,template:theme,site:siteData,projects:projectData}));setStatus("Saved locally")}catch{setStatus("Local storage is full")}},400);return()=>{active=false;clearTimeout(t)}}
   if(latest.current===lastSaved.current){reportStatus("Saved online");return()=>{active=false}}
   reportStatus("Unsaved changes");const t=setTimeout(async()=>{
      if(saving.current||!pageId)return;
      saving.current=true;setStatus("Saving…");const payload=latest.current;
      let saved=false;try{const out=await saveLayoutAction(pageId,JSON.parse(payload),rev.current);
       if(out.ok&&typeof out.revision==="number"){saved=true;rev.current=out.revision;lastSaved.current=payload;setStatus(latest.current===payload?"Saved online":"Unsaved changes");}
       else setStatus(`Save failed: ${out.message}`);
      }catch{setStatus("Save failed. Check your connection.")}
      finally{saving.current=false;if(saved&&latest.current!==lastSaved.current)setHistTick(t=>t+1);}
   },950);return()=>{active=false;clearTimeout(t)};
 },[layout,theme,siteData,projectData,demo,pageId,loaded,histTick]);
 // Save failures are intentionally visible; navigating away while dirty warns the user.
 useEffect(()=>{if(demo||!loaded)return;const fn=(e:BeforeUnloadEvent)=>{if(latest.current!==lastSaved.current){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",fn);return()=>window.removeEventListener("beforeunload",fn)},[demo,loaded]);
 function beginFreeformGesture(e:ReactPointerEvent<HTMLDivElement>,blockId:string,nodeId:string,resizing:boolean){
   if(!loaded||preview)return;const block=layout.blocks.find(x=>x.id===blockId),node=(block?.props.nodes as FreeformNode[]|undefined)?.find(x=>x.id===nodeId);
   const el=e.currentTarget,stage=el.closest(".freeform-stage");if(!node||!stage)return;
   if(node.locked){e.stopPropagation();setSelected(blockId);setSelectedNode(nodeId);return;}
   e.preventDefault();e.stopPropagation();setSelected(blockId);setSelectedNode(nodeId);
   const rect=stage.getBoundingClientRect(),initial=copy(node.layout[device]||node.layout.desktop);const px=e.clientX,py=e.clientY;let moved=false;let next=initial;
   const move=(event:PointerEvent)=>{const dx=(event.clientX-px)/rect.width*100,dy=(event.clientY-py)/rect.height*100;if(Math.abs(dx)+Math.abs(dy)>.5)moved=true;
    const grid=(v:number)=>snapEnabled?snap(v):v;const p={...initial};if(resizing){p.w=clamp(grid(initial.w+dx),12,100-p.x);p.h=clamp(grid(initial.h+dy),10,100-p.y)}else{p.x=clamp(grid(initial.x+dx),0,100-p.w);p.y=clamp(grid(initial.y+dy),0,100-p.h);}next=p;
    Object.assign(el.style,{left:p.x+"%",top:p.y+"%",width:p.w+"%",height:p.h+"%"});};
   const up=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",cancel);if(moved)changeNode(blockId,nodeId,n=>{n.layout[device]=next;});else {el.style.removeProperty("left");el.style.removeProperty("top");el.style.removeProperty("width");el.style.removeProperty("height");}};
   const cancel=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up);window.removeEventListener("pointercancel",cancel);["left","top","width","height"].forEach(x=>el.style.removeProperty(x));};
   window.addEventListener("pointermove",move);window.addEventListener("pointerup",up,{once:true});window.addEventListener("pointercancel",cancel,{once:true});
 }
 // Keyboard alternatives are essential for users who cannot drag with a pointer.
 useEffect(()=>{
  if(preview||!selected||!selectedNode)return;
  const onKey=(e:KeyboardEvent)=>{
   const target=e.target as HTMLElement;
   if(["INPUT","TEXTAREA","SELECT"].includes(target?.tagName)||target?.isContentEditable)return;
   const keys:Record<string,[number,number]>={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};
   const d=keys[e.key];if(!d)return;e.preventDefault();
   const step=e.shiftKey?4:2;
   changeNode(selected,selectedNode,n=>{if(n.locked)return;const old=n.layout[device];n.layout[device]=constrainPosition({...old,x:old.x+d[0]*step,y:old.y+d[1]*step});});
  };
  window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
 },[preview,selected,selectedNode,layout,device,changeNode]);
 const newPreview=<PortfolioRenderer layout={layout} site={siteData} projects={projectData} template={theme} experience={experience} education={education} certifications={certifications} skillGroups={skillGroups} device={device} editable={!preview} selectedBlock={selected} selectedNode={selectedNode} onBlockSelect={(id)=>{setSelected(id);setSelectedNode(null)}} onNodePointerDown={!preview?beginFreeformGesture:undefined} onDropAtIndex={!preview?dropBlock:undefined} onBlockDragStart={!preview?(e,id)=>e.dataTransfer.setData("devfolio/moving",id):undefined}/>;
 const previewClass=preview?"is-preview":"";
 async function importJson(file:File|undefined){if(!file)return;if(file.size>1024*1024){setStatus("Import must be smaller than 1 MB");return;}
   try{const input=JSON.parse(await file.text()) as Record<string,unknown>;const next=cleanLayout(input.layout);if(!confirm("Replace your local demo draft with this imported design?"))return;
    updateLayout(next);if(input.site)setSiteData(cleanSite(input.site));if(Array.isArray(input.projects))setProjectData(input.projects.slice(0,100).map(cleanProject));
    if(["minimal","midnight","grid"].includes(String(input.template)))setTheme(input.template as TemplateName);
    setSelected(null);setSelectedNode(null);setStatus("Imported draft");
   }catch{setStatus("Invalid or unsupported draft JSON");}}
 function exportJson(){const blob=new Blob([JSON.stringify({layout,template:theme,site:siteData,projects:projectData},null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="devfolio-draft.json";a.click();URL.revokeObjectURL(url)}
 function resetDemo(){if(!demo||!confirm("Reset the local demo portfolio?"))return;localStorage.removeItem("devfolio.phase3.demo.v1");const fresh=defaultLayout();hist.current=[fresh];pointer.current=0;setLayout(fresh);setSiteData(exampleSite);setProjectData(exampleProjects);setTheme("minimal");setSelected(null);setSelectedNode(null);lastSaved.current=JSON.stringify(fresh);setHistoryControls({canUndo:false,canRedo:false})}
 if(!loaded)return <div className="studio-loading">Loading your local workspace…</div>;
 return <div className="studio-root">
  <div className="studio-topbar"><Link href={demo?"/":"/dashboard"} className="studio-logo"><span>DS.</span> Devfolio <strong>Studio</strong></Link><span className="studio-breadcrumb">{demo?"Local demonstration":"Your portfolio"} <i>/</i> {pageKey==="home"?"Home":"Projects"}</span>{!demo&&<nav className="studio-page-nav" aria-label="Editor pages"><Link href="/studio/home" className={pageKey==="home"?"active":""}>Home</Link><Link href="/studio/projects" className={pageKey==="projects"?"active":""}>Projects</Link></nav>}<div className="studio-toolbar"><span className={`save-indicator ${status.startsWith("Save failed")?"error":""}`}>{status}</span><button className="tool-button" onClick={undo} disabled={!canUndo} title="Undo">Undo</button><button className="tool-button" onClick={redo} disabled={!canRedo} title="Redo">Redo</button><button className={`tool-button ${snapEnabled?"active-tool":""}`} aria-pressed={snapEnabled} onClick={()=>setSnapEnabled(p=>!p)} title="Snap freeform elements to 2% grid">Snap {snapEnabled?"on":"off"}</button><div className="device-switch" role="group" aria-label="Preview device">{(["desktop","tablet","mobile"] as Device[]).map(d=><button key={d} aria-pressed={device===d} className={device===d?"active":""} onClick={()=>setDevice(d)}>{d}</button>)}</div><button className="button small" onClick={()=>setPreview(v=>!v)}>{preview?"Edit layout":"Preview"}</button>{demo?<><label className="tool-button import-draft-label">Import <input type="file" accept="application/json,.json" onChange={e=>{void importJson(e.target.files?.[0]);e.target.value=""}}/></label><button className="button small primary" onClick={exportJson}>Export</button></>:<Link className="button small primary" href="/dashboard">Publishing</Link>}</div></div>
  <div className="studio-body">
   {!preview&&<aside className="studio-side"><div className="studio-tabs">{(["blocks","layers","content","design"] as const).map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t}</button>)}</div><div className="studio-side-content">
    {tab==="blocks"&&<><p className="panel-eyebrow">COMPONENT LIBRARY</p><h3>Build your page</h3><p className="panel-help">Choose a block or drag it onto the canvas.</p><div className="block-library">{groups.map(t=><button draggable key={t} className="block-library-item" onDragStart={e=>e.dataTransfer.setData("devfolio/block",t)} onClick={()=>addBlock(t)}><span className="block-symbol">{({Hero:"H",ProjectGrid:"▦",About:"A",Skills:"S",Text:"T",Image:"▧",Contact:"C",Freeform:"⊞",Experience:"E",Education:"Ed",Certifications:"✓"} as Record<BlockType,string>)[t]}</span>{labels[t]}</button>)}</div><div className="studio-tip"><strong>Design tip</strong><p>Start with a template. Customize only the sections that need to feel unique.</p></div></>}
    {tab==="layers"&&<><p className="panel-eyebrow">PAGE STRUCTURE</p><h3>Sections</h3><p className="panel-help">Reorder, select and manage your page sections.</p>{layout.blocks.map((b,i)=><div key={b.id} className={`layer-row ${selected===b.id?"active":""} ${b.hidden?"layer-hidden":""}`}><button onClick={()=>{setSelected(b.id);setSelectedNode(null)}}>{String(i+1).padStart(2,"0")} · {labels[b.type]}</button><div className="layer-controls"><button onClick={()=>changeBlock(b.id,x=>{x.hidden=!x.hidden})} aria-label={`${b.hidden?"Show":"Hide"} ${labels[b.type]}`}>{b.hidden?"Show":"Hide"}</button><button disabled={i===0} onClick={()=>swapBlock(b.id,-1)} aria-label={`Move ${labels[b.type]} up`}>Up</button><button disabled={i===layout.blocks.length-1} onClick={()=>swapBlock(b.id,1)} aria-label={`Move ${labels[b.type]} down`}>Down</button></div></div>)}</>}
    {tab==="design"&&<><p className="panel-eyebrow">APPEARANCE</p><h3>Your template</h3><p className="panel-help">Your content stays intact when you change a design.</p>{templateOptions.map(t=><button key={t.id} className={`template-picker ${theme===t.id?"active":""}`} onClick={()=>{if(demo)setTheme(t.id);else window.location.assign("/dashboard/settings")}}><div className={`template-swatch template-${t.id}`}><i/><i/><i/></div><strong>{t.name}</strong><span>{t.description}</span></button>)}<button className="button small full" onClick={applyPreset}>Apply selected layout preset</button><p className="panel-help">Preset affects the page arrangement only. Content records remain intact. You can Undo the change.</p>{!demo&&<p className="panel-help">Save account-wide template colors from Portfolio Settings.</p>}</>}
    {tab==="content"&&<><p className="panel-eyebrow">CONTENT SOURCE</p><h3>Your information</h3><p className="panel-help">Changes here flow into matching visual blocks.</p>{demo?<><label className="field-label">Your name<input value={siteData.name} onChange={e=>setSiteData(p=>({...p,name:e.target.value.slice(0,100)}))}/></label><label className="field-label">Professional role<input value={siteData.role} onChange={e=>setSiteData(p=>({...p,role:e.target.value.slice(0,120)}))}/></label><label className="field-label">Hero headline<input value={siteData.heroOne} onChange={e=>setSiteData(p=>({...p,heroOne:e.target.value.slice(0,130)}))}/></label><label className="field-label">Introduction<textarea rows={4} value={siteData.intro} onChange={e=>setSiteData(p=>({...p,intro:e.target.value.slice(0,1000)}))}/></label><h4>Featured project</h4>{projectData[0]&&<><label className="field-label">Project title<input value={projectData[0].title} onChange={e=>setProjectData(p=>p.map((x,i)=>i===0?{...x,title:e.target.value.slice(0,120)}:x))}/></label><label className="field-label">Summary<textarea value={projectData[0].summary} onChange={e=>setProjectData(p=>p.map((x,i)=>i===0?{...x,summary:e.target.value.slice(0,1800)}:x))}/></label></>}</>:<><p>For consistency, project data is managed in the content dashboard.</p><Link href="/dashboard/profile" className="button small full">Edit profile</Link><Link href="/dashboard/projects" className="button small full">Manage projects</Link></>}</>}
   </div></aside>}
   <main className={`studio-main ${previewClass}`}><div className="canvas-top"><div><strong>{preview?"Portfolio preview":"Page canvas"}</strong><p>{preview?"Live rendering from the same approved components":"Select a section to customize its layout and properties"}</p></div><div className="canvas-actions"><span>{device.charAt(0).toUpperCase()+device.slice(1)} · {device==="desktop"?"1200":device==="tablet"?"820":"390"}px</span>{demo&&<button className="tool-button" onClick={resetDemo}>Reset demo</button>}</div></div><div className="canvas-scroll"><div className={`canvas-surface device-canvas-${device}`}>
     {newPreview}
   </div></div></main>
   {!preview&&<aside className="studio-inspector"><p className="panel-eyebrow">INSPECTOR</p><h3>{currentBlock?labels[currentBlock.type]:"Select an element"}</h3>{!currentBlock?<p className="panel-help">Click a section in the canvas or select it from Layers.</p>:<div className="inspector-content">
    <div className="inspector-heading">Section settings</div>
    <label className="option-check"><input type="checkbox" checked={!currentBlock.hidden} onChange={e=>changeBlock(currentBlock.id,b=>{b.hidden=!e.target.checked})}/> Show on published website</label>
    <label className="field-label">Text alignment<select value={currentBlock.style.textAlign||"left"} onChange={e=>changeBlock(currentBlock.id,b=>{b.style.textAlign=e.target.value as "left"|"center"})}><option value="left">Left</option><option value="center">Center</option></select></label>
    <label className="field-label">Content width<select value={currentBlock.style.contentWidth||"default"} onChange={e=>changeBlock(currentBlock.id,b=>{b.style.contentWidth=e.target.value as "default"|"wide"|"narrow"})}><option value="default">Standard</option><option value="narrow">Narrow</option><option value="wide">Wide</option></select></label>
    <label className="field-label">Background<select value={currentBlock.style.surface} onChange={e=>changeBlock(currentBlock.id,b=>{b.style.surface=e.target.value as Block["style"]["surface"]})}><option value="plain">Clean white</option><option value="soft">Soft surface</option><option value="contrast">Contrast</option></select></label>
    <label className="field-label">Vertical spacing · {device} <span>{currentBlock.style.responsivePadding?.[device]??currentBlock.style.paddingY}px</span><input type="range" min="0" max="140" step="2" value={currentBlock.style.responsivePadding?.[device]??currentBlock.style.paddingY} onChange={e=>changeBlock(currentBlock.id,b=>{b.style.responsivePadding={...b.style.responsivePadding,[device]:Number(e.target.value)}})}/></label>
    {currentBlock.type==="Text"&&<>{(["eyebrow","title","body"] as const).map(k=><label className="field-label" key={k}>{k}<textarea rows={k==="body"?4:2} value={pick(currentBlock.props,k)} onChange={e=>changeBlock(currentBlock.id,b=>{b.props[k]=e.target.value})}/></label>)}</>}
    {currentBlock.type==="ProjectGrid"&&<><label className="field-label">Heading<input value={pick(currentBlock.props,"title")} onChange={e=>changeBlock(currentBlock.id,b=>{b.props.title=e.target.value})}/></label><label className="field-label">Columns<select value={Number(currentBlock.props.columns||2)} onChange={e=>changeBlock(currentBlock.id,b=>{b.props.columns=Number(e.target.value)})}><option value="1">One</option><option value="2">Two</option><option value="3">Three</option></select></label><label className="field-label">Projects shown<input type="number" min="1" max="36" value={Number(currentBlock.props.maxProjects||6)} onChange={e=>changeBlock(currentBlock.id,b=>{b.props.maxProjects=Number(e.target.value)})}/></label></>}
    {currentBlock.type==="Image"&&<><label className="field-label">Image HTTPS URL<input value={pick(currentBlock.props,"src")} placeholder="https://..." onChange={e=>changeBlock(currentBlock.id,b=>{b.props.src=e.target.value})}/></label><label className="field-label">Alt text<input value={pick(currentBlock.props,"alt")} onChange={e=>changeBlock(currentBlock.id,b=>{b.props.alt=e.target.value})}/></label><p className="panel-help">Project images are managed in Media Library. Standalone image blocks currently accept public HTTPS URLs.</p></>}
    {currentBlock.type==="Freeform"&&<>
      <p className="panel-help">Drag elements on the canvas. Resize using their bottom-right handle; positions are independent for every device.</p>
      <label className="field-label">Section heading<input value={pick(currentBlock.props,"title")} onChange={e=>changeBlock(currentBlock.id,b=>{b.props.title=e.target.value})}/></label>
      <label className="field-label">Section height · {device}<input type="number" min="200" max="1100" value={Number((currentBlock.props.height as Record<Device,number>)[device])} onChange={e=>changeBlock(currentBlock.id,b=>{(b.props.height as Record<Device,number>)[device]=Number(e.target.value)})}/></label>
      <div className="inspector-heading">Add element</div><div className="element-add-grid">{(["note","label","button","image"] as const).map(kind=><button key={kind} className="button small" onClick={()=>addFreeformNode(currentBlock.id,kind)}>{kind[0].toUpperCase()+kind.slice(1)}</button>)}</div>
      <div className="inspector-heading">Layers · {activeNodes.length}</div>
      <div className="element-layer-list">{activeNodes.map((n,i)=><div key={n.id} className={`element-layer ${selectedNode===n.id?"active":""} ${n.hidden?"is-muted":""}`}>
        <button className="element-layer-select" onClick={()=>setSelectedNode(n.id)}><span>{String(i+1).padStart(2,"0")}</span>{n.text||n.kind||"Element"}</button>
        <button title={n.locked?"Unlock":"Lock"} onClick={()=>changeNode(currentBlock.id,n.id,x=>{x.locked=!x.locked})}>{n.locked?"Unlock":"Lock"}</button>
        <button title={n.hidden?"Show":"Hide"} onClick={()=>changeNode(currentBlock.id,n.id,x=>{x.hidden=!x.hidden})}>{n.hidden?"Show":"Hide"}</button>
      </div>)}</div>
      {currentNode&&<><div className="inspector-heading">Selected element · {currentNode.kind||"note"}</div>
        {currentNode.kind!=="image"&&<label className="field-label">Text<textarea rows={3} value={currentNode.text} onChange={e=>changeNode(currentBlock.id,currentNode.id,n=>{n.text=e.target.value})}/></label>}
        {currentNode.kind==="image"&&<><label className="field-label">Image URL (HTTP/HTTPS)<input value={currentNode.src||""} onChange={e=>changeNode(currentBlock.id,currentNode.id,n=>{n.src=e.target.value})} placeholder="https://example.com/photo.jpg"/></label><label className="field-label">Accessible alt text<input value={currentNode.alt||""} onChange={e=>changeNode(currentBlock.id,currentNode.id,n=>{n.alt=e.target.value})}/></label></>}
        {currentNode.kind==="button"&&<label className="field-label">Button URL (HTTP/HTTPS)<input value={currentNode.href||""} onChange={e=>changeNode(currentBlock.id,currentNode.id,n=>{n.href=e.target.value})}/></label>}
        <label className="field-label">Colour preset<select value={currentNode.tone||"light"} onChange={e=>changeNode(currentBlock.id,currentNode.id,n=>{n.tone=e.target.value as FreeformNode["tone"]})}><option value="light">Soft</option><option value="dark">Dark</option><option value="accent">Accent</option></select></label>
        <div className="position-grid">{(["x","y","w","h"] as const).map(k=><label className="field-label" key={k}>{k.toUpperCase()} %<input type="number" min="0" max="100" value={currentNode.layout[device][k]} disabled={currentNode.locked} onChange={e=>changeNode(currentBlock.id,currentNode.id,n=>{n.layout[device]=constrainPosition({...n.layout[device],[k]:Number(e.target.value)})})}/></label>)}</div>
        <p className="panel-help">Tip: select an element and use arrow keys to move it. Hold Shift for larger steps.</p>
        <div className="inspector-actions"><button className="button small" onClick={()=>changeNodeLayer(currentBlock.id,currentNode.id,-1)} disabled={activeNodes[0]?.id===currentNode.id}>Send back</button><button className="button small" onClick={()=>changeNodeLayer(currentBlock.id,currentNode.id,1)} disabled={activeNodes.at(-1)?.id===currentNode.id}>Bring forward</button></div>
        <div className="inspector-actions"><button className="button small" onClick={()=>duplicateNode(currentBlock.id,currentNode.id)}>Duplicate</button><button className="button small danger" onClick={()=>{changeBlock(currentBlock.id,b=>{b.props.nodes=(b.props.nodes as FreeformNode[]).filter(n=>n.id!==currentNode.id)});setSelectedNode(null)}}>Remove</button></div>
      </>}
    </>}
    <div className="inspector-divider"/><div className="inspector-actions"><button className="button small" onClick={()=>duplicateBlock(currentBlock.id)}>Duplicate</button><button className="button small danger" onClick={()=>deleteBlock(currentBlock.id)}>Delete section</button></div>
   </div>}</aside>}
  </div>
  {demo&&<div className="demo-disclaimer">Local prototype only. Your edits stay in this browser; no login, cloud saving or public publishing is active here.</div>}
 </div>;
}
