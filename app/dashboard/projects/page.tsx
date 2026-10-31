import Link from "next/link";
import {requirePortfolio} from "@/lib/auth";
import {ProjectList} from "@/components/dashboard/ProjectList";
import {cleanProject} from "@/lib/validation";
export default async function ProjectsPage(){const {portfolio,supabase}=await requirePortfolio();const {data,error}=await supabase.from("projects").select("*").eq("portfolio_id",portfolio.id).order("sort_order").order("created_at");if(error)throw new Error(error.message);
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">CONTENT EDITOR</span><h1>Projects</h1><p>Create detailed work samples, upload screenshots and arrange featured projects.</p></div><Link href="/dashboard/projects/new" className="button primary">Add a project</Link></div><ProjectList projects={(data||[]).map(cleanProject)}/></main>;
}
