import {requirePortfolio} from '@/lib/auth';
import {BetaFeedbackForm} from '@/components/dashboard/BetaFeedbackForm';
export const dynamic='force-dynamic';
export default async function BetaFeedbackPage(){
 const {userId,portfolio,supabase}=await requirePortfolio();
 const {data,error}=await supabase.from('beta_feedback').select('id,kind,severity,title,status,created_at').eq('portfolio_id',portfolio.id).eq('reporter_id',userId).order('created_at',{ascending:false}).limit(10);
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">BETA PROGRAM</span><h1>Feedback & issues</h1><p>Tell us what works well and what needs to improve. Your reports are private to your account and the platform operator.</p></div></div>
  <div className="content-two-column"><section className="panel-card"><h2>Share your feedback</h2><p className="muted">Describe a problem or suggest an improvement. You can submit up to five reports per hour.</p><BetaFeedbackForm/></section>
  <section className="panel-card"><h2>Recent reports</h2>{error?<p role="alert">Unable to load previous reports. Ensure the Phase 6 migration is applied.</p>:data?.length? <ul className="beta-feedback-list">{data.map(item=><li key={item.id}><strong>{item.title}</strong><span>{item.kind} · {item.status} · {new Date(item.created_at).toLocaleDateString()}</span></li>)}</ul>:<p className="empty-note">No reports yet. You can also share positive feedback and suggestions.</p>}</section></div>
 </main>;
}
