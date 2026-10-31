import {readPublishedPortfolio} from '@/lib/publishing/read';
import {portfolioPublicUrl} from '@/lib/publishing/urls';
export const dynamic='force-dynamic';
const xml=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export async function GET(_request:Request,{params}:{params:Promise<{handle:string}>}){
 const {handle}=await params;
 const doc=await readPublishedPortfolio(handle);
 if(!doc)return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});
 const base=portfolioPublicUrl(handle);
 const pages=doc.pages.map(x=>x.key==='home'?'':`/${x.key}`);
 const projects=doc.projects.filter(x=>x.visible!==false).map(p=>`/projects/${p.slug}`);
 const unique=[...new Set([...pages,...projects])];
 const body='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+unique.map(path=>`<url><loc>${xml(base+path)}</loc></url>`).join('')+'</urlset>';
 return new Response(body,{headers:{'content-type':'application/xml; charset=utf-8','cache-control':'no-store'}});
}
