import {NextResponse, type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {hasSupabaseConfig,appUrl} from "@/lib/config";
export async function GET(request:NextRequest){
  const {searchParams}=request.nextUrl;
  const code=searchParams.get("code");
  // The redirect path is fixed: never trust a user-provided open redirect.
  if(!code||!hasSupabaseConfig())return NextResponse.redirect(new URL("/login?error=callback",appUrl));
  const supabase=await createClient();
  const {error}=await supabase.auth.exchangeCodeForSession(code);
  const destination=searchParams.get("next")==="/reset-password"?"/reset-password":"/dashboard";
  return NextResponse.redirect(new URL(error?"/login?error=verification":destination,appUrl));
}
