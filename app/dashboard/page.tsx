import Link from "next/link";
import {requirePortfolio} from "@/lib/auth";
import {rootDomain} from "@/lib/config";
import {PublishControls} from "@/components/dashboard/Forms";
import {portfolioPublicUrl} from "@/lib/publishing/urls";
export default async function Dashboard(){const {portfolio,supabase}=await requirePortfolio();const [{data:profile},{count:projectCount},{data:pages}]=await Promise.all([
 supabase.from("portfolio_profiles").select("name,role").eq("portfolio_id",portfolio.id).maybeSingle(),
 supabase.from("projects").select("id",{count:"exact",head:true}).eq("portfolio_id",portfolio.id),
 supabase.from("portfolio_pages").select("id,page_key,title").eq("portfolio_id",portfolio.id).order("sort_order")
 ]);
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">OVERVIEW</span><h1>{profile?.name?`Welcome, ${profile.name.split(" ")[0]}.`:"Welcome to your workspace."}</h1><p>Build something you are proud to share.</p></div><Link className="button primary" href="/studio/home">Open visual designer</Link></div>
 <div className="metrics-row"><div className="metric-card"><span>PORTFOLIO STATUS</span><strong>{portfolio.status==="published"?"Live":portfolio.status==="unpublished"?"Unpublished":"Draft"}</strong><p>{portfolio.handle?`${portfolio.handle}.${rootDomain}`:"Choose your portfolio username"}</p></div><div className="metric-card"><span>PROJECTS</span><strong>{String(projectCount??0).padStart(2,"0")}</strong><p>Showcase the work that matters</p></div><div className="metric-card"><span>PAGES</span><strong>{String(pages?.length||0).padStart(2,"0")}</strong><p>Ready to design and refine</p></div></div>
 <div className="dashboard-two-column"><div className="panel-card"><div className="panel-topline"><h2>Your portfolio checklist</h2><span>GET STARTED</span></div><div className="task-row"><span className="task-number">01</span><div><h3>Tell your story</h3><p>Write your headline, introduction and professional background.</p></div><Link href="/dashboard/profile">Edit profile</Link></div><div className="task-row"><span className="task-number">02</span><div><h3>Build your project gallery</h3><p>Add a project, screenshots, technical details and verified links.</p></div><Link href="/dashboard/projects/new">Add project</Link></div><div className="task-row"><span className="task-number">03</span><div><h3>Complete your technical story</h3><p>Organize skills and experience, then customize the website.</p></div><Link href="/dashboard/skills">Add skills</Link></div></div><div className="panel-card"><div className="panel-topline"><h2>Publishing</h2><span>BETA</span></div><PublishControls status={portfolio.status} handle={portfolio.handle} root={rootDomain}/><p className="helper-note"><Link href="/dashboard/publishing">Manage release history and rollback</Link></p></div></div>
 </main>
}
