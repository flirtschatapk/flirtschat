import {createServerClient} from "@supabase/ssr";
import {NextResponse,type NextRequest} from "next/server";

const authPages=new Set(["/login","/signup"]);
const protectedPrefixes=["/dashboard","/onboarding","/discover","/matches","/chats","/chat","/settings","/profile","/premium","/visitors","/block","/notifications"];

function matches(pathname:string,prefix:string){return pathname===prefix||pathname.startsWith(`${prefix}/`)}

export async function middleware(request:NextRequest){
  const pathname=request.nextUrl.pathname;
  if(pathname==="/auth/callback"||pathname==="/auth/retry")return NextResponse.next();
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return NextResponse.next();
  let response=NextResponse.next({request});
  const supabase=createServerClient(url,key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}});
  const{data:{user}}=await supabase.auth.getUser();
  if(matches(pathname,"/admin")&&pathname!=="/admin/login"){
    if(!user)return NextResponse.redirect(new URL("/admin/login",request.url));
    const role=user.app_metadata?.role;
    if(!["admin","moderator","super_admin"].includes(role))return NextResponse.redirect(new URL("/dashboard",request.url));
    return response;
  }
  const isProtected=protectedPrefixes.some(prefix=>matches(pathname,prefix));
  if(!user){
    if(isProtected){if(process.env.NODE_ENV==="development")console.info("[AuthTrace] redirect to login reason",{reason:"middleware:no_session",pathname});const login=new URL("/login",request.url);login.searchParams.set("next",pathname);return NextResponse.redirect(login)}
    return response;
  }
  const{data:profile,error}=await supabase.from("fc_profiles").select("onboarding_completed").eq("id",user.id).maybeSingle();
  if(error&&isProtected)return NextResponse.redirect(new URL("/auth/retry",request.url));
  const complete=Boolean(profile?.onboarding_completed);
  if(!complete&&isProtected&&pathname!=="/onboarding")return NextResponse.redirect(new URL("/onboarding",request.url));
  if(complete&&pathname==="/onboarding")return NextResponse.redirect(new URL("/dashboard",request.url));
  if(complete&&authPages.has(pathname))return NextResponse.redirect(new URL("/dashboard",request.url));
  if(!complete&&authPages.has(pathname))return NextResponse.redirect(new URL("/onboarding",request.url));
  return response;
}

export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]};
