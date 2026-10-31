"use client";
import {useState,type FormEvent} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/browser";
import {appUrl} from "@/lib/config";

type Mode="login"|"signup"|"forgot"|"reset";
export function AuthForm({mode}:{mode:Mode}){
 const router=useRouter();const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [name,setName]=useState("");const [notice,setNotice]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setNotice("");setBusy(true);
  try{const client=createClient();
   if(mode==="login"){const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;router.replace("/dashboard");router.refresh();return;}
   if(mode==="signup"){const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:`${appUrl}/auth/callback`,data:{display_name:name}}});if(error)throw error;setNotice("Check your inbox to confirm your account. Then sign in.");}
   if(mode==="forgot"){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${appUrl}/auth/callback?next=/reset-password`});if(error)throw error;setNotice("If the address is registered, a password reset email will arrive.");}
   if(mode==="reset"){const {error}=await client.auth.updateUser({password});if(error)throw error;setNotice("Password updated. You can return to your dashboard.");}
  }catch(err){setNotice(err instanceof Error?err.message:"Something went wrong.");}finally{setBusy(false);}
 }
 return <div className="auth-card"><div className="eyebrow">DEVFOLIO STUDIO</div><h1>{({login:"Welcome back",signup:"Create your account",forgot:"Reset your password",reset:"Choose a new password"} as const)[mode]}</h1><p className="muted">{mode==="signup"?"Start building a portfolio that reflects your best work.":mode==="login"?"Your projects, your design and your portfolio are here.":"We'll help you access your portfolio securely."}</p>
 <form onSubmit={submit} className="form-stack">
  {mode==="signup"&&<label className="field-label">Your name<input value={name} onChange={e=>setName(e.target.value)} required maxLength={100} placeholder="Alex Morgan"/></label>}
  {mode!=="reset"&&<label className="field-label">Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email"/></label>}
  {mode!=="forgot"&&<label className="field-label">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} placeholder="At least 8 characters" autoComplete={mode==="login"?"current-password":"new-password"}/></label>}
  <button type="submit" className="button primary full" disabled={busy}>{busy?"Please wait…":({login:"Sign in",signup:"Create account",forgot:"Send reset email",reset:"Update password"} as const)[mode]}</button>
 </form>{notice&&<p className="form-notice" role="status">{notice}</p>}
 <div className="auth-foot">{mode==="login"?<><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/signup">Create an account</Link></span></>:<Link href="/login">Back to sign in</Link>}</div>
 </div>
}
export function SignOutButton(){const [busy,setBusy]=useState(false);const router=useRouter();return <button className="sidebar-link signout" disabled={busy} onClick={async()=>{setBusy(true);try{await createClient().auth.signOut();router.replace("/login");router.refresh();}finally{setBusy(false);}}}>Sign out</button>}
