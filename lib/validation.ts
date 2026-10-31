import type {Block, BlockType, Device, FreeformNode, LayoutDocument, Position, PublishedSnapshot, SiteContent, PortfolioProject} from "./models";
export const BLOCK_TYPES:BlockType[] = ["Hero","ProjectGrid","About","Skills","Text","Image","Contact","Freeform","Experience","Education","Certifications"];
const validSurfaces=["plain","soft","contrast"];
const val=(x:unknown)=>typeof x==="string"?x:"";
const trim=(x:unknown,n:number)=>val(x).trim().slice(0,n);
const num=(x:unknown,min:number,max:number,def:number)=>typeof x==="number"&&Number.isFinite(x)?Math.min(max,Math.max(min,x)):def;
export function safeHttpUrl(x:unknown):string {
  const s=trim(x,2048);if(!s)return "";
  try{const u=new URL(s);return ["https:","http:"].includes(u.protocol)?u.href:"";}catch{return "";}
}
export function validHandle(x:unknown):x is string {return typeof x==="string"&&/^[a-z][a-z0-9-]{2,29}$/.test(x)&&!x.endsWith("-")&&!new Set(["www","app","api","admin","dashboard","login","signup","studio","p","sites","static","assets","mail","support","help","dev","test","localhost","demo"]).has(x);}
function cleanPosition(p:unknown):Position {const o=p&&typeof p==="object"?p as Record<string,unknown>:{};const w=num(o.w,12,100,45),h=num(o.h,10,100,25);return {x:num(o.x,0,100-w,0),y:num(o.y,0,100-h,0),w,h};}
function cleanNodes(v:unknown):FreeformNode[]{
 if(!Array.isArray(v))return[];
 const seen=new Set<string>();
 return v.slice(0,25).map((raw,i)=>{
  const r=raw&&typeof raw==="object"?raw as Record<string,unknown>:{};
  const l=r.layout&&typeof r.layout==="object"?r.layout as Record<string,unknown>:{};
  const desktop=cleanPosition(l.desktop),tablet=cleanPosition(l.tablet??desktop);
  const mobile=cleanPosition(l.mobile??{x:6,y:i*24,w:88,h:20});
  const id=trim(r.id,64)||`node-${i}`;
  if(seen.has(id))throw new Error("Duplicate freeform element ID");
  seen.add(id);
  const kind=["note","label","button","image"].includes(val(r.kind))?r.kind as FreeformNode["kind"]:"note";
  return {id,kind,text:trim(r.text,160),src:safeHttpUrl(r.src),alt:trim(r.alt,180),href:safeHttpUrl(r.href),tone:["light","dark","accent"].includes(val(r.tone))?r.tone as FreeformNode["tone"]:"light",hidden:r.hidden===true,locked:r.locked===true,layout:{desktop,tablet,mobile}};
 });
}
export function cleanLayout(raw:unknown):LayoutDocument {
 if(!raw||typeof raw!=="object")throw new Error("Invalid layout document");
 const o=raw as Record<string,unknown>;if(o.schemaVersion!==1||!Array.isArray(o.blocks)||o.blocks.length>60)throw new Error("Unsupported layout version or block limit exceeded");
 const seen=new Set<string>();const blocks:Block[]=o.blocks.map((rawBlock,i)=>{
   if(!rawBlock||typeof rawBlock!=="object")throw new Error("Invalid block");const r=rawBlock as Record<string,unknown>;if(!BLOCK_TYPES.includes(r.type as BlockType))throw new Error("Unsupported block type");
   const id=trim(r.id,64)||`block-${i}`;if(seen.has(id))throw new Error("Duplicate block ID");seen.add(id);
   const p=r.props&&typeof r.props==="object"?r.props as Record<string,unknown>:{};
   const props:Record<string,unknown>={};
   if(r.type==="ProjectGrid"){props.title=trim(p.title,100)||"Selected work";props.columns=num(p.columns,1,3,2);props.maxProjects=num(p.maxProjects,1,36,6);}
   if(r.type==="Text"){props.title=trim(p.title,160);props.body=trim(p.body,1800);props.eyebrow=trim(p.eyebrow,80);}
   if(r.type==="Image"){props.src=safeHttpUrl(p.src);props.alt=trim(p.alt,180);props.caption=trim(p.caption,180);}
   if(r.type==="Freeform"){const ht=p.height&&typeof p.height==="object"?p.height as Record<string,unknown>:{};props.title=trim(p.title,100)||"My approach";props.height={desktop:num(ht.desktop,200,780,320),tablet:num(ht.tablet,200,780,300),mobile:num(ht.mobile,280,1100,410)};props.nodes=cleanNodes(p.nodes);}
   const st=r.style&&typeof r.style==="object"?r.style as Record<string,unknown>:{};
   const surface=validSurfaces.includes(st.surface as string)?st.surface as Block["style"]["surface"]:"plain";
   const responsive=st.responsivePadding&&typeof st.responsivePadding==="object"?st.responsivePadding as Record<string,unknown>:{};
   return {id,type:r.type as BlockType,hidden:r.hidden===true,props,style:{surface,paddingY:num(st.paddingY,0,140,56),
     textAlign:["left","center"].includes(val(st.textAlign))?st.textAlign as "left"|"center":"left",
     contentWidth:["default","narrow","wide"].includes(val(st.contentWidth))?st.contentWidth as "default"|"narrow"|"wide":"default",
     responsivePadding:{desktop:num(responsive.desktop,0,140,num(st.paddingY,0,140,56)),tablet:num(responsive.tablet,0,140,num(st.paddingY,0,140,56)),mobile:num(responsive.mobile,0,140,num(st.paddingY,0,140,56))}}};
 });return {schemaVersion:1,blocks};
}
export function cleanSite(raw:unknown):SiteContent {const r=raw&&typeof raw==="object"?raw as Record<string,unknown>:{};return {name:trim(r.name,100),role:trim(r.role,120),heroOne:trim(r.heroOne,130),heroTwo:trim(r.heroTwo,130),intro:trim(r.intro,1000),about:trim(r.about,2500),email:trim(r.email,254),github:safeHttpUrl(r.github),linkedin:safeHttpUrl(r.linkedin),skills:Array.isArray(r.skills)?r.skills.slice(0,60).map(x=>trim(x,45)).filter(Boolean):[]};}
export function cleanProject(raw:unknown):PortfolioProject {const r=raw&&typeof raw==="object"?raw as Record<string,unknown>:{};return {id:trim(r.id,100),title:trim(r.title,120),slug:trim(r.slug,100),category:trim(r.category,60),summary:trim(r.summary,1800),github:safeHttpUrl(r.github),demo:safeHttpUrl(r.demo),tech:Array.isArray(r.tech)?r.tech.slice(0,30).map(x=>trim(x,40)).filter(Boolean):[],
 category_id:trim(r.category_id,50)||null,problem:trim(r.problem,3000),solution:trim(r.solution,3000),contribution:trim(r.contribution,2000),outcome:trim(r.outcome,2000),featured:r.featured===true,visible:r.visible!==false,
 coverUrl:safeHttpUrl(r.coverUrl),gallery:Array.isArray(r.gallery)?r.gallery.slice(0,12).map(item=>{const q=(item&&typeof item==="object"?item:{}) as Record<string,unknown>;return {url:safeHttpUrl(q.url),alt:trim(q.alt,180),caption:trim(q.caption,240)}}):[]};}
export function cleanSnapshot(raw:unknown):PublishedSnapshot|null {
 try{if(!raw||typeof raw!=="object")return null;const r=raw as Record<string,unknown>;
 if(r.schemaVersion!==1||!["minimal","midnight","grid"].includes(String(r.template)))return null;
 if(!Array.isArray(r.pages)||r.pages.length>12||!Array.isArray(r.projects)||r.projects.length>100)return null;
 const keys=new Set<string>();const pages=r.pages.map((p)=>{if(!p||typeof p!=="object")throw Error("Invalid page");const v=p as Record<string,unknown>;const key=trim(v.key,60);if(!/^[a-z][a-z0-9-]*$/.test(key)||keys.has(key))throw Error("Invalid page key");keys.add(key);return {key,title:trim(v.title,80),layout:cleanLayout(v.layout)};});
 return {schemaVersion:1,template:r.template as PublishedSnapshot["template"],site:cleanSite(r.site),projects:r.projects.map(cleanProject),pages,
 experience:Array.isArray(r.experience)?r.experience.slice(0,50) as PublishedSnapshot["experience"]:[],
 education:Array.isArray(r.education)?r.education.slice(0,50) as PublishedSnapshot["education"]:[],
 certifications:Array.isArray(r.certifications)?r.certifications.slice(0,80) as PublishedSnapshot["certifications"]:[],
 skillGroups:Array.isArray(r.skillGroups)?r.skillGroups.slice(0,30) as PublishedSnapshot["skillGroups"]:[]};}catch{return null;}
}
