import {readPublishedPortfolio} from '@/lib/publishing/read';
import {portfolioPublicUrl} from '@/lib/publishing/urls';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{handle:string}>}){
 const {handle}=await params;
 const doc=await readPublishedPortfolio(handle);
 const body=doc?`User-agent: *\nAllow: /\nSitemap: ${portfolioPublicUrl(handle)}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n';
 return new Response(body,{headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
}
