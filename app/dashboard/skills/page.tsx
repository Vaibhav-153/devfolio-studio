import {requirePortfolio} from "@/lib/auth";
import {SkillWorkspace} from "@/components/dashboard/SkillWorkspace";
export default async function SkillsPage(){const {portfolio,supabase}=await requirePortfolio();const [g,s]=await Promise.all([
 supabase.from("skill_groups").select("id,name,sort_order").eq("portfolio_id",portfolio.id).order("sort_order"),
 supabase.from("skills").select("id,name,sort_order,group_id").eq("portfolio_id",portfolio.id).order("sort_order")
 ]);if(g.error||s.error)throw new Error("Could not load skills. Apply the Phase 2 database migration.");
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">EXPERTISE</span><h1>Skills & tools</h1><p>Organize technologies into clear, meaningful groups that your portfolio can display automatically.</p></div></div><SkillWorkspace groups={(g.data||[]).map(x=>({...x,skills:[]}))} skills={s.data||[]}/></main>;
}
