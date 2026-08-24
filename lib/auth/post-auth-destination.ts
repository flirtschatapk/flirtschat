import type {SupabaseClient,User} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/server";

export type PostAuthDestination = "/onboarding" | "/global";

export async function getPostAuthDestination(userId:string,client?:SupabaseClient):Promise<PostAuthDestination>{
  const supabase=client??await createClient();
  const{data,error}=await supabase.from("fc_profiles").select("onboarding_completed").eq("id",userId).maybeSingle();
  if(error)throw new Error(`Profile lookup failed: ${error.code}`);
  return data?.onboarding_completed?"/global":"/onboarding";
}

export async function ensureInitialProfile(user:User,client?:SupabaseClient){
  const supabase=client??await createClient();
  const{data,error}=await supabase.from("fc_profiles").select("id").eq("id",user.id).maybeSingle();
  if(error)throw new Error(`Profile lookup failed: ${error.code}`);
  if(data)return;
  const metadata=user.user_metadata??{};
  const candidate=[metadata.full_name,metadata.name].find(value=>typeof value==="string"&&value.trim()) as string|undefined;
  const displayName=candidate?.trim().slice(0,100)??"";
  const metadataUsername=typeof metadata.username==="string"?metadata.username.trim().toLowerCase():"";
  const username=/^[a-z0-9_]{3,24}$/.test(metadataUsername)?metadataUsername:`user_${user.id.replaceAll("-","").slice(0,12)}`;
  const{error:insertError}=await supabase.from("fc_profiles").upsert({id:user.id,username,display_name:displayName,onboarding_completed:false},{onConflict:"id",ignoreDuplicates:true});
  if(insertError&&insertError.code!=="23505")throw new Error(`Profile creation failed: ${insertError.code}`);
}
