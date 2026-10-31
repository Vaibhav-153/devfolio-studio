import {AuthForm} from "@/components/auth/AuthForm";
import {hasSupabaseConfig} from "@/lib/config";
import Link from "next/link";
export default function Signup(){return <main className="auth-page">{hasSupabaseConfig()?<AuthForm mode="signup"/>:<div className="auth-card"><h1>Account setup not configured</h1><p>Connect Supabase before allowing real sign-ups.</p><Link className="button primary" href="/demo">Try local demo</Link></div>}</main>}
