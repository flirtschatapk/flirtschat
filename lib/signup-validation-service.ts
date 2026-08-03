import {createClient} from "./supabase/client";
import {isSupabaseConfigured} from "./supabase/config";

const reservedUsernames=new Set(["admin","support","flirtschat","alex_99","test","demo"]);
export async function checkUsernameAvailability(username:string){
  const value=username.trim().toLowerCase();
  if(reservedUsernames.has(value))return{available:false};
  if(isSupabaseConfigured()){
    const{data,error}=await createClient().rpc("fc_is_username_available",{candidate:value});
    if(error)throw new Error(error.message);
    return{available:Boolean(data)};
  }
  await new Promise(resolve=>setTimeout(resolve,320));
  return{available:true};
}
