import {requirePortfolio} from "@/lib/auth";
import {CareerWorkspace} from "@/components/dashboard/CareerWorkspace";
export default async function CareerPage(){const {portfolio,supabase}=await requirePortfolio();const [e,d,c]=await Promise.all([
 supabase.from("experience_entries").select("*").eq("portfolio_id",portfolio.id).order("sort_order").order("started_on",{ascending:false}),
 supabase.from("education_entries").select("*").eq("portfolio_id",portfolio.id).order("sort_order"),
 supabase.from("certifications").select("*").eq("portfolio_id",portfolio.id).order("sort_order")
 ]);if(e.error||d.error||c.error)throw new Error("Could not load career information. Apply the Phase 2 database migration.");
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">YOUR STORY</span><h1>Experience & education</h1><p>Professional background, learning and verified credentials—all editable without code.</p></div></div><CareerWorkspace experience={e.data||[]} education={d.data||[]} certifications={c.data||[]}/></main>;
}
