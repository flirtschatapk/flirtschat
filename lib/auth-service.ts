import {createClient} from "./supabase/client";
import {getSiteUrl} from "./site-url";

function logDevelopment(context:string,error:unknown){if(process.env.NODE_ENV==="development")console.error(context,error)}
export async function requestPasswordReset(email:string){const{error}=await createClient().auth.resetPasswordForEmail(email.trim(),{redirectTo:`${getSiteUrl()}/auth/callback?next=/reset-password`});if(error)logDevelopment("Password reset request failed",{code:error.code,status:error.status});return{delivered:true}}
export async function updatePassword(password:string){const{error}=await createClient().auth.updateUser({password});if(error){logDevelopment("Password update failed",{code:error.code,status:error.status});throw new Error("We couldn’t update your password. Request a new reset link and try again.")}return{updated:true}}
export async function resendVerificationEmail(email:string){const{error}=await createClient().auth.resend({type:"signup",email:email.trim(),options:{emailRedirectTo:`${getSiteUrl()}/auth/callback`}});if(error){logDevelopment("Verification resend failed",{code:error.code,status:error.status});throw new Error("We couldn’t send another verification email right now. Please try again.")}return{delivered:true}}
