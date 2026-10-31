import {requirePortfolio} from "@/lib/auth";
import {ProfileForm} from "@/components/dashboard/Forms";
import {cleanSite} from "@/lib/validation";
export default async function ProfilePage(){const {portfolio,supabase}=await requirePortfolio();const {data,error}=await supabase.from("portfolio_profiles").select("*").eq("portfolio_id",portfolio.id).single();if(error)throw new Error(error.message);
 const initial=cleanSite({name:data.name,role:data.role,heroOne:data.hero_one,heroTwo:data.hero_two,intro:data.intro,about:data.about,email:data.email,github:data.github,linkedin:data.linkedin,skills:data.skills});
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">CONTENT EDITOR</span><h1>Your professional story</h1><p>Keep your details up to date. Every linked section changes with them.</p></div></div><section className="panel-card form-panel"><ProfileForm initial={initial}/></section></main>}
