import {NextResponse} from "next/server";
import {createClient,type CookieToSet} from "@/lib/supabase/server";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {ensureInitialProfile,getPostAuthDestination} from "@/lib/auth/post-auth-destination";

export async function GET(request:Request){
  const url=new URL(request.url);
  const code=url.searchParams.get("code");
  if(!code||!isSupabaseConfigured())return NextResponse.redirect(new URL("/login?error=oauth_callback_failed",url.origin));
  try{
    const responseCookies:CookieToSet[]=[];
    const supabase=await createClient(values=>responseCookies.push(...values));
    const{error}=await supabase.auth.exchangeCodeForSession(code);
    if(error){console.error("OAuth callback: code exchange failed",{status:error.status});return NextResponse.redirect(new URL("/login?error=oauth_callback_failed",url.origin))}
    const{data:{user},error:userError}=await supabase.auth.getUser();
    if(userError||!user){console.error("OAuth callback: authenticated user unavailable");return NextResponse.redirect(new URL("/login?error=oauth_callback_failed",url.origin))}
    await ensureInitialProfile(user);
    const next=url.searchParams.get("next");
    if(next==="/reset-password"){
      const response=NextResponse.redirect(new URL(next,url.origin));
      responseCookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      return response;
    }
    const destination=await getPostAuthDestination(user.id);
    console.info("OAuth callback completed",{userId:user.id,destination});
    const response=NextResponse.redirect(new URL(destination,url.origin));
    responseCookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    return response;
  }catch(error){
    console.error("OAuth callback: profile routing failed",{message:error instanceof Error?error.message:"Unknown error"});
    return NextResponse.redirect(new URL("/auth/error?reason=profile_unavailable",url.origin));
  }
}
