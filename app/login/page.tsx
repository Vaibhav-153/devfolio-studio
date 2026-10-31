import {AuthForm} from "@/components/auth/AuthForm";
import {hasSupabaseConfig} from "@/lib/config";
import Link from "next/link";
export default function Login(){return <main className="auth-page">{hasSupabaseConfig()?<AuthForm mode="login"/>:<div className="auth-card"><h1>Connect Supabase to enable accounts</h1><p>The demonstration is available without credentials. Account sign-in requires a configured Supabase project.</p><Link className="button primary" href="/demo">Explore the local demo</Link><Link className="text-link" href="/setup">Read setup instructions</Link></div>}</main>}
