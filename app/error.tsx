'use client';
export default function ApplicationError({reset}:{error:Error & {digest?:string};reset:()=>void}){
  return <main className="recovery-page" role="main"><div className="recovery-card"><span className="eyebrow">DEVFOLIO STUDIO</span><h1>Something didn&apos;t load.</h1><p>Your saved portfolio content is not affected. Please try again. If the issue continues, contact platform support.</p><button type="button" onClick={reset} className="button primary">Try again</button><a href="/dashboard" className="button secondary">Go to dashboard</a></div></main>;
}
