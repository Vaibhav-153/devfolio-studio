import {AuthForm} from "@/components/auth/AuthForm";
import {hasSupabaseConfig} from "@/lib/config";
export default function Forgot(){return <main className="auth-page">{hasSupabaseConfig()?<AuthForm mode="forgot"/>:<div className="auth-card">Connect Supabase to use password recovery.</div>}</main>}
