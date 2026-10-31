import {requirePortfolio} from "@/lib/auth";
import {SettingsForm} from "@/components/dashboard/Forms";
export default async function Settings(){const {portfolio}=await requirePortfolio();return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">PERSONALIZE</span><h1>Portfolio settings</h1><p>Choose a professional template and reserve your website address.</p></div></div><div className="panel-card form-panel"><SettingsForm handle={portfolio.handle} template={portfolio.template} status={portfolio.status}/></div></main>}
