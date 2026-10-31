/** Shared, framework-independent contracts for the structured content editor. */
export type ProjectCategory = {id:string; name:string; slug:string; sort_order:number};
export type MediaAsset = {id:string; file_name:string; mime_type:string; byte_size:number; kind:"image"|"resume"; alt_text:string; storage_path:string; upload_status:"pending"|"ready"; preview_url?:string};
export type ProjectImage = {id:string;asset_id:string;project_id:string;alt_text:string;caption:string;sort_order:number;is_cover:boolean;url?:string};
export type ExperienceEntry = {id:string;organization:string;position:string;location:string;employment_type:string;started_on:string|null;ended_on:string|null;is_current:boolean;description:string;sort_order:number};
export type EducationEntry = {id:string;institution:string;qualification:string;field_of_study:string;started_year:number|null;ended_year:number|null;description:string;sort_order:number};
export type CertificationEntry = {id:string;name:string;issuer:string;issued_on:string|null;verify_url:string;description:string;sort_order:number};
export type SkillEntry = {id:string;group_id:string;name:string;sort_order:number};
export type SkillGroup = {id:string;name:string;sort_order:number;skills:string[]};
export type CareerKind = "experience"|"education"|"certification";
export type ActionStatus = {ok:boolean;message:string;id?:string};

export const text = (x:unknown,max:number):string => typeof x==="string"?x.trim().slice(0,max):"";
export function slugify(x:unknown,limit=70):string {
 return text(x,300).toLowerCase().normalize("NFKD").replace(/[^a-z0-9 -]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,limit).replace(/-+$/g,"");
}
export function validIsoDate(x:unknown):string|null {
 const s=text(x,10);if(!s)return null;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw new Error("Please enter a valid date.");
 const [year,month,day]=s.split("-").map(Number);
 const d=new Date(Date.UTC(year,month-1,day));
 if(d.getUTCFullYear()!==year||d.getUTCMonth()+1!==month||d.getUTCDate()!==day)throw new Error("Please enter a valid calendar date.");
 return s;
}
export function validYear(x:unknown):number|null {
 const s=text(x,4);if(!s)return null;
 const n=Number(s);if(!Number.isInteger(n)||n<1950||n>2100)throw new Error("Year must be between 1950 and 2100.");
 return n;
}
export function ensureDateRange(start:string|null,end:string|null):void {
 if(start&&end&&end<start)throw new Error("End date must not be before start date.");
}
export function approvedUpload(name:string,mime:string,size:number):{kind:"image"|"resume";ext:string;fileName:string}{
 const types:Record<string,{kind:"image"|"resume";ext:string}>={"image/png":{kind:"image",ext:"png"},"image/jpeg":{kind:"image",ext:"jpg"},"image/webp":{kind:"image",ext:"webp"},"application/pdf":{kind:"resume",ext:"pdf"}};
 const type=types[mime];if(!type)throw new Error("Choose a PNG, JPEG, WebP or PDF file.");
 if(!Number.isInteger(size)||size<=0||size>5*1024*1024)throw new Error("Files must be smaller than 5 MB.");
 const fileName=text(name,200).replace(/[\\/\u0000-\u001f]/g,"_")||`upload.${type.ext}`;
 return {...type,fileName};
}
export function parseGitHubRepoUrl(value:unknown):{owner:string;repo:string;url:string}{
 const raw=text(value,600);
 let u:URL;try{u=new URL(raw);}catch{throw new Error("Enter a public GitHub repository URL.");}
 if(u.protocol!=="https:"||u.hostname.toLowerCase()!=="github.com"||u.username||u.password||u.port||u.search||u.hash)
  throw new Error("Use a public https://github.com/owner/repository URL.");
 const parts=u.pathname.replace(/\/$/,"").split("/").filter(Boolean);
 if(parts.length!==2||!(/^[A-Za-z0-9-]{1,39}$/.test(parts[0])))throw new Error("Enter the repository URL, not a file or branch URL.");
 const repo=parts[1].replace(/\.git$/i,"");
 if(!/^[A-Za-z0-9._-]{1,100}$/.test(repo)||repo==="."||repo==="..")throw new Error("Invalid repository name.");
 return {owner:parts[0],repo,url:`https://github.com/${parts[0]}/${repo}`};
}
