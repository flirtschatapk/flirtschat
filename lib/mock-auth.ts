import type {AuthError} from "@supabase/supabase-js";
import type {LoginValues,SignupValues} from "./auth-schema";
import {createClient} from "./supabase/client";
import {getSiteUrl} from "./site-url";

function logDevelopment(context:string,error:unknown){if(process.env.NODE_ENV==="development")console.error(context,error)}

function friendlyLoginError(error:AuthError){
  const code=(error.code??"").toLowerCase(),message=error.message.toLowerCase();
  if(code.includes("email_not_confirmed")||message.includes("email not confirmed"))return "Please verify your email before signing in.";
  if(error.status===429||code.includes("rate")||message.includes("too many"))return "Too many attempts. Please wait a moment and try again.";
  if(code.includes("invalid_credentials")||message.includes("invalid login credentials"))return "The email or password is incorrect.";
  return "We couldn’t sign you in right now. Please try again.";
}

function networkMessage(){return typeof navigator!=="undefined"&&!navigator.onLine?"You’re offline. Reconnect and try again.":"We couldn’t sign you in right now. Please try again."}

async function loadDestination(){
  const response=await fetch("/api/auth/destination",{method:"POST"});
  if(!response.ok)throw new Error("destination_failed");
  return (await response.json() as {destination:"/onboarding"|"/dashboard"}).destination;
}

export async function loginWithEmail(values:LoginValues){
  try{
    const supabase=createClient();
    const{data,error}=await supabase.auth.signInWithPassword({email:values.email.trim(),password:values.password});
    if(error){logDevelopment("Email login failed",{code:error.code,status:error.status});throw new Error(friendlyLoginError(error))}
    window.location.assign(await loadDestination());
    return{user:data.user};
  }catch(error){
    if(error instanceof Error&&error.message!=="destination_failed"&&!["Failed to fetch","NetworkError"].includes(error.message))throw error;
    logDevelopment("Email login network/routing failure",error);
    throw new Error(networkMessage());
  }
}

export async function loginWithGoogle(){
  const redirectTo=`${getSiteUrl()}/auth/callback`;
  const{data,error}=await createClient().auth.signInWithOAuth({provider:"google",options:{redirectTo}});
  if(error){logDevelopment("Google OAuth initiation failed",{code:error.code,status:error.status});throw new Error("We couldn’t complete Google sign-in. Please try again.")}
  return{user:null,url:data.url};
}

export async function createAccount(values:SignupValues){
  const username=values.username.trim().toLowerCase();
  const check=await fetch("/api/auth/username",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username})});
  if(!check.ok)throw new Error("We couldn’t create your account with those details.");
  const availability=await check.json() as {available:boolean};
  if(!availability.available)throw new Error("This username is already taken");
  const{data,error}=await createClient().auth.signUp({email:values.email.trim(),password:values.password,options:{
    emailRedirectTo:`${getSiteUrl()}/auth/callback`,data:{full_name:values.fullName.trim(),username},
  }});
  if(error){logDevelopment("Email signup failed",{code:error.code,status:error.status});throw new Error("We couldn’t create this account with those details. Try signing in or use another email.")}
  if(!data.user)throw new Error("We couldn’t create your account with those details.");
  return{user:data.user,needsEmailVerification:!data.session,destination:data.session?await loadDestination():null};
}
