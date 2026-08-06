import {blockUser,reportUser,type ReportCategory} from "@/lib/community-service";import {createClient} from "@/lib/supabase/client";
export type ConnectionResult={status:"accepted"|"pending"};
export async function sendConnectionRequest(profileId:string):Promise<ConnectionResult>{const supabase=createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sign in required");const{data,error}=await supabase.rpc("fc_swipe_and_match",{target:profileId,swipe_action:"like"});if(error)throw error;const result=Array.isArray(data)?data[0]:data;return{status:result?.matched?"accepted":"pending"}}
export async function reportProfile(profileId:string,reason:string){if(!reason)throw new Error("Choose a report reason");await reportUser(profileId,(reason as ReportCategory)||"Other","");return{reported:true,profileId}}
export async function blockProfile(profileId:string){await blockUser(profileId);return{blocked:true}}
