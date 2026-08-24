import {NextResponse} from "next/server";
import {ensureInitialProfile,getPostAuthDestination} from "@/lib/auth/post-auth-destination";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {createClient,type CookieToSet} from "@/lib/supabase/server";

const development=process.env.NODE_ENV==="development";
function debug(message:string,details?:Record<string,unknown>){if(development)console.info(`[auth/callback] ${message}`,details??{})}

export async function GET(request:Request){
  const url=new URL(request.url),code=url.searchParams.get("code");
  debug("callback reached");
  debug("code received",{received:Boolean(code)});
  if(!code||!isSupabaseConfigured())return NextResponse.redirect(new URL("/login?error=oauth_callback_failed",url.origin));

  const responseCookies:CookieToSet[]=[];
  const redirectWithCookies=(pathname:string)=>{const response=NextResponse.redirect(new URL(pathname,url.origin));responseCookies.forEach(({name,value,options})=>response.cookies.set(name,value,options));return response};
  const supabase=await createClient(values=>responseCookies.push(...values));
  const{error:exchangeError}=await supabase.auth.exchangeCodeForSession(code);
  if(exchangeError){debug("exchangeCodeForSession failure",{status:exchangeError.status,code:exchangeError.code});return NextResponse.redirect(new URL("/login?error=oauth_callback_failed",url.origin))}
  debug("exchangeCodeForSession success",{cookiesWritten:responseCookies.length>0});

  const{data:{user},error:userError}=await supabase.auth.getUser();
  if(userError||!user){debug("getUser failure",{status:userError?.status,code:userError?.code});return redirectWithCookies("/auth/retry")}
  debug("authenticated user",{userId:user.id});

  if(url.searchParams.get("next")==="/reset-password")return redirectWithCookies("/reset-password");
  try{
    const{data:existing,error:lookupError}=await supabase.from("fc_profiles").select("id,onboarding_completed").eq("id",user.id).maybeSingle();
    if(lookupError)throw lookupError;
    debug("profile lookup",{profileFound:Boolean(existing),onboardingComplete:Boolean(existing?.onboarding_completed)});
    if(!existing){await ensureInitialProfile(user,supabase);debug("minimum profile created",{userId:user.id})}
    const destination=existing?.onboarding_completed?"/global":await getPostAuthDestination(user.id,supabase);
    debug("destination selected",{destination});
    return redirectWithCookies(destination);
  }catch(error){
    debug("profile routing failure",{code:typeof error==="object"&&error&&"code" in error?String(error.code):"unknown"});
    return redirectWithCookies("/auth/retry");
  }
}
