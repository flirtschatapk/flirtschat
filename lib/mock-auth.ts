import type { LoginValues, SignupValues } from "./auth-schema";
import { establishMockSession } from "./mock-auth-guard";
import { loadOnboarding } from "./onboarding-storage";
import {createClient} from "./supabase/client";
import {isSupabaseConfigured} from "./supabase/config";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function loginWithEmail(values: LoginValues) {
  if(isSupabaseConfigured()){
    if(!values.email.includes("@"))throw new Error("Use your email address to sign in.");
    const supabase=createClient();
    const{data,error}=await supabase.auth.signInWithPassword({email:values.email,password:values.password});
    if(error)throw new Error(error.message);
    establishMockSession(values.remember);
    const{data:profile}=await supabase.from("fc_profiles").select("onboarding_completed").eq("id",data.user.id).maybeSingle();
    window.location.assign(profile?.onboarding_completed?"/dashboard":"/onboarding");
    return{user:data.user};
  }
  await wait(900);
  if (values.email.toLowerCase().includes("error")) throw new Error("We could not sign you in. Check your details and try again.");
  establishMockSession(values.remember);
  window.location.assign(loadOnboarding().completed ? "/dashboard" : "/onboarding");
  return { user: { email: values.email } };
}

export async function loginWithGoogle(remember = true) {
  if(isSupabaseConfigured()){
    const supabase=createClient();
    const redirectTo=`${window.location.origin}/auth/callback?next=/onboarding`;
    const{data,error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo}});
    if(error)throw new Error(error.message);
    return{user:null,url:data.url,remember};
  }
  await wait(750);
  establishMockSession(remember);
  if (window.location.pathname === "/login") window.location.assign(loadOnboarding().completed ? "/dashboard" : "/onboarding");
  return { user: { email: "demo@flirtschat.example" } };
}

export async function createAccount(values: SignupValues) {
  if(isSupabaseConfigured()){
    const supabase=createClient();
    const{data,error}=await supabase.auth.signUp({email:values.email,password:values.password,options:{
      emailRedirectTo:`${window.location.origin}/auth/callback?next=/onboarding`,
      data:{full_name:values.fullName,username:values.username.toLowerCase()},
    }});
    if(error)throw new Error(error.message);
    if(!data.user)throw new Error("Account creation failed. Please try again.");
    if(!data.session)throw new Error("Account created. Check your email to verify it, then continue signing in.");
    if(data.session)establishMockSession(true);
    return{user:data.user,needsEmailVerification:!data.session};
  }
  await wait(1100);
  if (values.email.toLowerCase().includes("error")) throw new Error("An account with this email could not be created.");
  return { user: { email: values.email, name: values.fullName },needsEmailVerification:false };
}
