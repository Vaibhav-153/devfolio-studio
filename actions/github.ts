"use server";
import {requirePortfolio} from "@/lib/auth";
import {parseGitHubRepoUrl,text} from "@/lib/content";
import {safeHttpUrl} from "@/lib/validation";
export type GitHubPreview={ok:boolean;message:string;project?:{title:string;summary:string;tech:string[];github:string;demo:string;readmeExcerpt:string;stars:number;updatedAt:string}};
export async function previewGitHubAction(repositoryUrl:string):Promise<GitHubPreview>{
 try{
  const parsed=parseGitHubRepoUrl(repositoryUrl);
  const {supabase}=await requirePortfolio();
  const {data:allowed,error:quotaError}=await supabase.rpc("consume_github_import_quota");
  if(quotaError)throw new Error("GitHub imports are not configured. Check the Phase 2 migration.");
  if(!allowed)throw new Error("Too many import requests. Try again after a short break.");
  const base=`https://api.github.com/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`;
  const headers={"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","User-Agent":"Devfolio-Studio-Portfolio-Builder"};
  const reply=await fetch(base,{headers,cache:"no-store",signal:AbortSignal.timeout(8500)});
  if(reply.status===403||reply.status===429)throw new Error("GitHub API limit reached. Try later or add the project manually.");
  if(!reply.ok)throw new Error("Public repository not found. Check the URL and visibility.");
  const repo=await reply.json() as Record<string,unknown>;
  if(repo.private===true)throw new Error("Private repositories are not supported in Release 1.");
  const title=text(repo.name,120).replace(/[-_]/g," ")||parsed.repo;
  const summary=text(repo.description,1800);
  const tech=[text(repo.language,40)].filter(Boolean);
  let readmeExcerpt="";
  try{const readme=await fetch(`${base}/readme`,{headers:{...headers,Accept:"application/vnd.github.raw+json"},cache:"no-store",signal:AbortSignal.timeout(6500)});
   if(readme.ok)readmeExcerpt=text((await readme.text()).slice(0,20000),600);
  }catch{/* README is optional; don't block a valid repository. */}
  const homepage=safeHttpUrl(repo.homepage);
  return {ok:true,message:"Repository found. Review every field before saving; this is a draft, not a verified case study.",project:{title,summary,tech,github:parsed.url,demo:homepage,readmeExcerpt,stars:Number(repo.stargazers_count)||0,updatedAt:text(repo.updated_at,30)}};
 }catch(e){return {ok:false,message:e instanceof Error?e.message:"GitHub preview failed."};}
}
