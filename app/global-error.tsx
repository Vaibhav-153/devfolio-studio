'use client';
export default function GlobalError({reset}:{error:Error & {digest?:string};reset:()=>void}){
  return <html lang="en"><body style={{fontFamily:'Arial,sans-serif',padding:'10vh 8vw',lineHeight:1.7}}><main><h1>Devfolio Studio is temporarily unavailable.</h1><p>Please reload the page. Previously saved portfolio data is retained.</p><button type="button" onClick={reset}>Try again</button></main></body></html>;
}
