import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {isSupabaseConfigured} from "@/lib/supabase/config";

export async function GET(request:Request){
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  const next=url.searchParams.get("next")||"/onboarding";
  const safeNext=next.startsWith("/")&&!next.startsWith("//")?next:"/onboarding";
  if(code&&isSupabaseConfigured()){
    const supabase=await createClient();
    const{error}=await supabase.auth.exchangeCodeForSession(code);
    if(!error){
      const complete=new URL("/auth/complete",url.origin);
      complete.searchParams.set("next",safeNext);
      return NextResponse.redirect(complete);
    }
  }
  return NextResponse.redirect(new URL("/login?error=auth_callback",url.origin));
}
