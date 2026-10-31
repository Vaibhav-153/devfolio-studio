'use client';
import {useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {submitBetaFeedback} from '@/actions/feedback';
export function BetaFeedbackForm(){
 const router=useRouter();const [busy,setBusy]=useState(false);const [notice,setNotice]=useState('');const [ok,setOk]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setNotice('');
  const form=e.currentTarget;const data=new FormData(form);const response=await submitBetaFeedback(data);
  setNotice(response.message);setOk(response.ok);setBusy(false);if(response.ok){form.reset();router.refresh();}
 }
 return <form className="beta-feedback-form" onSubmit={submit}>
  <div className="form-grid"><label className="field-label">Type of feedback
   <select name="kind" defaultValue="bug"><option value="bug">Something is not working</option><option value="usability">Something is confusing</option><option value="idea">Feature suggestion</option></select>
  </label><label className="field-label">Impact
   <select name="severity" defaultValue="normal"><option value="low">Small improvement</option><option value="normal">Affects my workflow</option><option value="blocking">I cannot continue</option></select>
  </label></div>
  <label className="field-label">Short title<input name="title" required minLength={5} maxLength={120} placeholder="Project image is not appearing in preview"/></label>
  <label className="field-label">What happened, and what did you expect?<textarea name="description" required minLength={20} maxLength={3000} rows={5} placeholder="Describe the steps you took, what you saw, and what should have happened."/></label>
  <input type="hidden" name="pagePath" value="/dashboard/feedback"/>
  <p className="helper-note">Please do not include passwords, access keys, customer records or other sensitive information.</p>
  <div className="form-footer"><button className="button primary" disabled={busy}>{busy?'Sending…':'Submit feedback'}</button></div>
  {notice&&<p role="status" className={`form-notice ${ok?'success':''}`}>{notice}</p>}
 </form>;
}
