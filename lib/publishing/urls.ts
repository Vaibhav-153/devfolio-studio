import {rootDomain} from '../config';
/** A published portfolio is available on a development path or a wildcard HTTPS subdomain. */
export function portfolioPublicUrl(handle:string):string{
  if(rootDomain==='localhost')return `http://localhost:3000/p/${handle}`;
  return `https://${handle}.${rootDomain}`;
}
export function portfolioPreviewPath(pageKey:string='home'):string{
  return `/preview/${encodeURIComponent(pageKey)}`;
}
