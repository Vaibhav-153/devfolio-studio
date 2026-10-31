import {NextResponse, type NextRequest} from "next/server";
import {getTenantHandle,isUnrecognizedChildHost} from "@/lib/host";
import {refreshAuth} from "@/lib/supabase/proxy";

export async function proxy(request:NextRequest){
  const host=request.headers.get("host")||"";
  const tenant=getTenantHandle(host);
  if(tenant){
    const path=request.nextUrl.pathname;
    // Tenant websites are public-only. Never expose the dashboard on a tenant host.
    if(path.startsWith("/api/")||path.startsWith("/dashboard")||path.startsWith("/studio")||path.startsWith("/preview")||path.startsWith("/auth/"))return new NextResponse("Not found",{status:404});
    const rewrite=request.nextUrl.clone();
    rewrite.pathname=`/p/${tenant}${path==="/"?"":path}`;
    return NextResponse.rewrite(rewrite);
  }
  // Unknown wildcard hosts must never render the platform login/dashboard.
  if(isUnrecognizedChildHost(host))return new NextResponse("Not found",{status:404});
  return refreshAuth(request);
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|pdf|css|js)$).*)"]};
