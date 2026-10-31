'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {publishAction,restoreReleaseAction,unpublishAction} from '@/actions/publishing';

type Release={id:string;version:number;created_at:string};
export function ReleasePanel({status,handle,publicUrl,activeReleaseId,releases}:{status:string;handle:string|null;publicUrl:string|null;activeReleaseId:string|null;releases:Release[]}){
 const [busy,setBusy]=useState(false);const [notice,setNotice]=useState<{ok:boolean;message:string}|null>(null);
 const router=useRouter();
 async function run(kind:'publish'|'unpublish'|'restore',id?:string){
  if(kind==='unpublish'&&!confirm('Unpublish your website? The published pages will no longer be publicly accessible.'))return;
  if(kind==='restore'&&!confirm('Restore this earlier release? This creates a new published version and does not overwrite your draft.'))return;
  setBusy(true);setNotice(null);
  try{const result=kind==='publish'?await publishAction():kind==='unpublish'?await unpublishAction():await restoreReleaseAction(id||'');setNotice(result);if(result.ok)router.refresh();}
  catch{setNotice({ok:false,message:'Unable to complete the request. Please try again.'});}
  finally{setBusy(false);}
 }
 return <div className="release-panel">
  <div className="publication-status"><span className={`publication-dot ${status==='published'?'live':''}`}/><div><strong>{status==='published'?'Website is live':status==='unpublished'?'Website is unpublished':'Private draft'}</strong><p>{handle?publicUrl:'Choose a portfolio username in Settings before publishing.'}</p></div></div>
  <div className="publish-actions">
   <button type="button" disabled={busy||!handle} className="button primary" onClick={()=>run('publish')}>{busy?'Processing…':status==='published'?'Publish latest changes':'Publish portfolio'}</button>
   {status==='published'&&<button disabled={busy} type="button" className="button" onClick={()=>run('unpublish')}>Unpublish</button>}
   {status==='published'&&publicUrl&&<a className="button" href={publicUrl} target="_blank" rel="noopener noreferrer">View live website</a>}
  </div>
  {notice&&<p className={`feedback ${notice.ok?'good':'bad'}`} role="status">{notice.message}</p>}
  <p className="helper-note">Publishing snapshots your current content and design. Unsaved draft changes are not included. Image URLs from published releases remain public even after unpublishing.</p>
  <div className="release-history"><div className="panel-topline"><h2>Release history</h2><span>{releases.length} saved</span></div>
   {releases.length===0?<p className="muted">Published versions will appear here.</p>:<div className="release-rows">{releases.map(r=><div className="release-row" key={r.id}>
    <div><strong>Version {r.version}</strong>{r.id===activeReleaseId&&status==='published'&&<span className="release-current">Current</span>}<p>{new Date(r.created_at).toLocaleString()}</p></div>
    <button type="button" className="button small" disabled={busy||r.id===activeReleaseId&&status==='published'} onClick={()=>run('restore',r.id)}>Restore</button>
   </div>)}</div>}
  </div>
 </div>;
}
