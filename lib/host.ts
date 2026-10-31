import {rootDomain} from "./config";
import {validHandle} from "./validation";
// Match ONLY direct subdomains of the configured root domain; do not trust arbitrary Host values.
export function getTenantHandle(host:string):string|null {
  const normalized=host.toLowerCase().split(":")[0].replace(/\.$/,"");
  const root=rootDomain.toLowerCase().replace(/^https?:\/\//,"").replace(/\/$/,"");
  if(normalized===root||!normalized.endsWith(`.${root}`))return null;
  const prefix=normalized.slice(0,-root.length-1);
  return validHandle(prefix)?prefix:null;
}

/** Detect any child hostname under our configured domain, including reserved or
 * malformed labels. Such hosts must not fall through to the root dashboard.
 */
export function isUnrecognizedChildHost(host:string):boolean {
  const normalized=host.toLowerCase().split(':')[0].replace(/\.$/,'');
  const root=rootDomain.toLowerCase().replace(/^https?:\/\//,'').replace(/\/$/,'');
  return normalized.endsWith(`.${root}`)&&normalized!==root&&!getTenantHandle(host);
}
