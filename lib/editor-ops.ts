import type {Block,BlockType,Device,FreeformNode,LayoutDocument,Position,TemplateName} from "./models";
import {cleanLayout} from "./validation";

export function deepCopy<T>(value:T):T{return JSON.parse(JSON.stringify(value)) as T;}
export function moveSection(doc:LayoutDocument,source:string,targetIndex:number):LayoutDocument {
 const next=deepCopy(doc),start=next.blocks.findIndex(b=>b.id===source);
 if(start<0||targetIndex<0||targetIndex>next.blocks.length)return next;
 const [item]=next.blocks.splice(start,1);
 next.blocks.splice(targetIndex>start?targetIndex-1:targetIndex,0,item);
 return cleanLayout(next);
}
export function duplicateSection(doc:LayoutDocument,id:string,newId:string,nodeIds:string[]=[]):LayoutDocument {
 const next=deepCopy(doc),index=next.blocks.findIndex(x=>x.id===id);
 if(index<0||next.blocks.some(x=>x.id===newId))return next;
 const block=deepCopy(next.blocks[index]);block.id=newId;
 if(block.type==="Freeform"&&Array.isArray(block.props.nodes)){
  (block.props.nodes as FreeformNode[]).forEach((n,i)=>n.id=nodeIds[i]||`${newId}-node-${i}`);
 }
 next.blocks.splice(index+1,0,block);return cleanLayout(next);
}
export function constrainPosition(pos:Position,step=2):Position {
 const snap=(n:number)=>Math.round(n/step)*step;
 const w=Math.min(100,Math.max(12,snap(pos.w))),h=Math.min(100,Math.max(10,snap(pos.h)));
 return {x:Math.min(100-w,Math.max(0,snap(pos.x))),y:Math.min(100-h,Math.max(0,snap(pos.y))),w,h};
}
export function editNodePosition(doc:LayoutDocument,blockId:string,nodeId:string,device:Device,p:Position):LayoutDocument {
 const next=deepCopy(doc),b=next.blocks.find(x=>x.id===blockId);
 if(!b||b.type!=="Freeform")return next;
 const node=(b.props.nodes as FreeformNode[]).find(n=>n.id===nodeId);
 if(!node||node.locked)return next;
 node.layout[device]=constrainPosition(p);return cleanLayout(next);
}
export function moveNodeLayer(doc:LayoutDocument,blockId:string,nodeId:string,offset:number):LayoutDocument{
 const next=deepCopy(doc),b=next.blocks.find(x=>x.id===blockId);
 if(!b||b.type!=="Freeform")return next;
 const nodes=b.props.nodes as FreeformNode[],i=nodes.findIndex(n=>n.id===nodeId),target=i+offset;
 if(i<0||target<0||target>=nodes.length)return next;
 [nodes[i],nodes[target]]=[nodes[target],nodes[i]];return cleanLayout(next);
}
export function makeNode(kind:NonNullable<FreeformNode["kind"]>,id:string):FreeformNode {
 return {id,kind,text:kind==="button"?"View my work":kind==="label"?"DESIGNED WITH INTENTION":kind==="image"?"Project visual":"A thoughtful idea",src:"",href:"",alt:"",tone:kind==="button"?"dark":"light",locked:false,hidden:false,
 layout:{desktop:{x:8,y:12,w:kind==="label"?30:42,h:kind==="label"?18:29},tablet:{x:8,y:12,w:45,h:28},mobile:{x:6,y:10,w:88,h:24}}};
}
/** Suggest a free slot on each device without changing any existing element positions. */
export function placeNewFreeformNode(node:FreeformNode,existing:FreeformNode[]):FreeformNode {
 const next=deepCopy(node);
 const positions:Record<Device,Position[]>={
  desktop:[{x:6,y:54,w:38,h:26},{x:52,y:72,w:40,h:22},{x:54,y:9,w:37,h:28},{x:7,y:9,w:39,h:27}],
  tablet:[{x:6,y:60,w:42,h:28},{x:51,y:64,w:43,h:26},{x:52,y:9,w:42,h:28},{x:6,y:9,w:42,h:27}],
  mobile:[{x:6,y:84,w:88,h:14},{x:6,y:62,w:88,h:18},{x:6,y:5,w:88,h:22},{x:6,y:30,w:88,h:23},{x:6,y:53,w:88,h:20}]
 };
 const overlaps=(p:Position,other:Position)=>{
  const x=Math.max(0,Math.min(p.x+p.w,other.x+other.w)-Math.max(p.x,other.x));
  const y=Math.max(0,Math.min(p.y+p.h,other.y+other.h)-Math.max(p.y,other.y));
  return x*y>p.w*p.h*0.1;
 };
 for(const device of ["desktop","tablet","mobile"] as Device[]){
  const slot=positions[device].find(p=>!existing.some(n=>overlaps(p,n.layout[device])));
  if(slot)next.layout[device]=slot;
 }
 return next;
}
const makeBlock=(id:string,type:BlockType):Block=>({id,type,props:type==="ProjectGrid"?{title:"Featured projects",columns:2,maxProjects:6}:type==="Text"?{eyebrow:"YOUR STORY",title:"A thoughtful heading",body:"Tell people what you build."}:type==="Freeform"?{title:"My process",height:{desktop:350,tablet:350,mobile:460},nodes:[makeNode("note",id+"-note")]}:{},style:{surface:"plain",paddingY:60}});
const presetOrders:Record<TemplateName,BlockType[]>={
 minimal:["Hero","ProjectGrid","About","Skills","Experience","Contact"],
 midnight:["Hero","Skills","ProjectGrid","Freeform","About","Contact"],
 grid:["Hero","ProjectGrid","ProjectGrid","About","Skills","Contact"]
};
/** Preset composition changes only the page tree, never the profile or project content. */
export function templateComposition(template:TemplateName,existing:LayoutDocument,idFactory:()=>string):LayoutDocument {
 const already=new Map<BlockType,Block[]>();for(const block of existing.blocks){const items=already.get(block.type)||[];items.push(deepCopy(block));already.set(block.type,items);}
 const blocks=presetOrders[template].map(type=>already.get(type)?.shift()||makeBlock(idFactory(),type));
 if(template==="grid"){
  blocks.filter(x=>x.type==="ProjectGrid").forEach((x,i)=>{x.props.title=i===0?"Selected work":"More projects";x.props.maxProjects=i===0?2:6;x.props.columns=i===0?2:3;});
 }
 if(template==="midnight"){
  const item=blocks.find(x=>x.type==="Freeform");if(item){item.style.surface="contrast";}
 }
 return cleanLayout({schemaVersion:1,blocks});
}
