import {createClient} from "@/lib/supabase/client";
import {likeProfile} from "@/lib/discover-service";

export type GlobalLikeState={likeCount:number;likedByMe:boolean};
type LikeStateRow={target_id:string;like_count:number|string;liked_by_me:boolean};

export async function loadGlobalLikeStates(targetIds:string[]):Promise<Record<string,GlobalLikeState>>{
  const states:Record<string,GlobalLikeState>={};targetIds.forEach(id=>{states[id]={likeCount:0,likedByMe:false}});if(!targetIds.length)return states;
  const supabase=createClient(),{data,error}=await supabase.rpc("fc_global_like_states",{target_ids:targetIds});if(error)throw error;
  for(const row of (data??[]) as LikeStateRow[]){const state=states[row.target_id];if(!state)continue;state.likeCount=Math.max(0,Number(row.like_count)||0);state.likedByMe=Boolean(row.liked_by_me)}
  return states;
}

export async function toggleGlobalLike(targetId:string,likedByMe:boolean){if(likedByMe){const supabase=createClient();const{error}=await supabase.rpc("fc_unlike_profile",{target:targetId});if(error)throw error;return}await likeProfile(targetId)}
