import {createClient} from "@/lib/supabase/client";
import {likeProfile} from "@/lib/discover-service";

export type GlobalLikeState={likeCount:number;likedByMe:boolean};
type SwipeRow={actor_id:string;target_id:string;action:"like"|"pass"|"super_like"};

export async function loadGlobalLikeStates(targetIds:string[]):Promise<Record<string,GlobalLikeState>>{
  const states:Record<string,GlobalLikeState>={};targetIds.forEach(id=>{states[id]={likeCount:0,likedByMe:false}});if(!targetIds.length)return states;
  const supabase=createClient(),{data:{user},error:userError}=await supabase.auth.getUser();if(userError||!user)throw userError??new Error("Authentication required");
  const{data,error}=await supabase.from("fc_swipes").select("actor_id,target_id,action").in("target_id",targetIds).in("action",["like","super_like"]);if(error)throw error;
  for(const row of (data??[]) as SwipeRow[]){const state=states[row.target_id];if(!state)continue;state.likeCount+=1;if(row.actor_id===user.id)state.likedByMe=true}
  return states;
}

export async function toggleGlobalLike(targetId:string,likedByMe:boolean){if(likedByMe){const supabase=createClient();const{error}=await supabase.rpc("fc_unlike_profile",{target:targetId});if(error)throw error;return}await likeProfile(targetId)}
