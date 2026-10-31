import {requirePortfolio} from "@/lib/auth";
import {CategoryManager} from "@/components/dashboard/CategoryManager";
export default async function CategoriesPage(){const {portfolio,supabase}=await requirePortfolio();const {data,error}=await supabase.from("project_categories").select("id,name,slug,sort_order").eq("portfolio_id",portfolio.id).order("sort_order").order("name");if(error)throw new Error(error.message);
 return <main className="dashboard-content"><div className="page-title-row"><div><span className="eyebrow">PROJECT ORGANIZATION</span><h1>Categories</h1><p>Make your work easy to explore. Category updates also update linked project labels.</p></div></div><CategoryManager categories={data||[]}/></main>;
}
