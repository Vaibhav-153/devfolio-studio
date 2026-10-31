import Link from 'next/link';
import {requirePortfolio} from '@/lib/auth';
import {ReleasePanel} from '@/components/publishing/ReleasePanel';
import {portfolioPublicUrl,portfolioPreviewPath} from '@/lib/publishing/urls';
export const dynamic='force-dynamic';
export default async function PublishingPage(){
 const {supabase,portfolio}=await requirePortfolio();
 const {data:releases,error}=await supabase.from('published_releases').select('id,version,created_at').eq('portfolio_id',portfolio.id).order('version',{ascending:false}).limit(30);
 if(error)throw Error('Unable to load your publishing history.');
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">GO LIVE</span><h1>Publish your portfolio.</h1><p>Keep editing privately. Publish only when you are happy with the result.</p></div><Link className="button" href={portfolioPreviewPath('home')} target="_blank">Preview draft</Link></div>
  <div className="panel-card publishing-workspace"><h2>Publication overview</h2><ReleasePanel status={portfolio.status} handle={portfolio.handle} publicUrl={portfolio.handle?portfolioPublicUrl(portfolio.handle):null} activeReleaseId={portfolio.active_release_id} releases={releases||[]}/></div>
  <div className="panel-card publishing-tips"><h2>Before you publish</h2><p>Make sure your portfolio username, name, professional role and at least one visible project are ready. Preview both desktop and mobile layouts in the visual editor. Published images are copied to permanent, public paths.</p><div className="publish-actions"><Link href="/dashboard/settings" className="button">Website address</Link><Link href="/studio/home" className="button">Visual designer</Link><Link href="/dashboard/projects" className="button">Manage projects</Link></div></div>
 </main>;
}
