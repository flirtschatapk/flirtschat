import {createClient} from "@/lib/supabase/client";
import type {DiscoverFilters,DiscoverProfile,DiscoverTab} from "./discover-types";

type RpcRow={id:string;username:string|null;display_name:string|null;bio:string|null;gender:string|null;date_of_birth:string|null;country:string|null;city:string|null;languages:string[]|null;interests:string[]|null;relationship_goal:string|null;verified:boolean|null;premium:boolean|null;last_seen_at:string|null;created_at:string|null;photo_keys:string[]|null};
export type DiscoveryActionState={premium:boolean;superLikesRemaining:number;rewindsRemaining:number;canRewind:boolean;boostStartedAt:string|null;boostExpiresAt:string|null;boostCooldownUntil:string|null};

const age=(dob:string|null)=>dob?Math.max(18,Math.floor((Date.now()-new Date(dob).getTime())/31557600000)):18;
const text=(value:unknown)=>typeof value==="string"?value.trim():"";
const stringArray=(value:unknown)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"&&Boolean(item.trim())):[];

function fromRpc(row:RpcRow):DiscoverProfile{
  return{id:row.id,name:text(row.display_name)||text(row.username)||"New user",username:text(row.username)||null,age:age(row.date_of_birth),gender:row.gender==="Man"?"Man":"Woman",city:text(row.city)||"Nearby",country:text(row.country),online:row.last_seen_at?Date.now()-new Date(row.last_seen_at).getTime()<60000:false,lastSeen:row.last_seen_at,isNew:row.created_at?Date.now()-new Date(row.created_at).getTime()<604800000:false,premium:Boolean(row.premium),verified:Boolean(row.verified),bio:text(row.bio),interests:stringArray(row.interests),photos:stringArray(row.photo_keys).map(key=>`/api/media/profile-photo?key=${encodeURIComponent(key)}`),relationshipGoal:text(row.relationship_goal)||"Still exploring",languages:stringArray(row.languages),distance:0};
}

export async function getProfiles(tab:DiscoverTab="all",filters?:DiscoverFilters):Promise<DiscoverProfile[]>{
  const supabase=createClient(),{data:{user},error:userError}=await supabase.auth.getUser();if(userError||!user)throw userError??new Error("Authentication required");
  const{data,error}=await supabase.rpc("fc_public_profiles");
  if(error)throw error;
  let profiles=((data??[]) as RpcRow[]).map(fromRpc);
  profiles=profiles.filter(profile=>(tab!=="new"||profile.isNew)&&(tab!=="verified"||profile.verified)&&(tab!=="premium"||profile.premium)&&(!filters||profile.age>=filters.minAge&&profile.age<=filters.maxAge&&(filters.showMe==="Everyone"||filters.showMe==="Women"&&profile.gender==="Woman"||filters.showMe==="Men"&&profile.gender==="Man")&&(!filters.onlineOnly||profile.online)&&(!filters.verifiedOnly||profile.verified)&&(!filters.premiumOnly||profile.premium)&&(!filters.relationshipGoal||profile.relationshipGoal===filters.relationshipGoal)&&(!filters.country||profile.country===filters.country)&&(filters.interests.length===0||filters.interests.some(item=>profile.interests.includes(item)))));
  return profiles;
}

async function swipe(target:string,swipe_action:"like"|"pass"|"super_like"){const supabase=createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sign in required");const{data,error}=await supabase.rpc("fc_swipe_and_match",{target,swipe_action});if(error)throw error;const result=Array.isArray(data)?data[0]:data;return{matched:Boolean(result?.matched),matchId:typeof result?.match_id==="string"?result.match_id:null}}
export async function likeProfile(id:string){return swipe(id,"like")}
export async function dislikeProfile(id:string){await swipe(id,"pass");return{profileId:id}}
export async function superLikeProfile(id:string){const result=await swipe(id,"super_like");return{...result,profileId:id}}
export async function getDiscoveryActionState():Promise<DiscoveryActionState>{const supabase=createClient(),{data,error}=await supabase.rpc("fc_discovery_action_state");if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row)throw new Error("Discovery state unavailable");return{premium:Boolean(row.premium),superLikesRemaining:Number(row.super_likes_remaining??0),rewindsRemaining:Number(row.rewinds_remaining??0),canRewind:Boolean(row.can_rewind),boostStartedAt:typeof row.boost_started_at==="string"?row.boost_started_at:null,boostExpiresAt:typeof row.boost_expires_at==="string"?row.boost_expires_at:null,boostCooldownUntil:typeof row.boost_cooldown_until==="string"?row.boost_cooldown_until:null}}
export async function rewindProfile(){const supabase=createClient(),{data,error}=await supabase.rpc("fc_rewind_latest_swipe");if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row?.profile_id)throw new Error("NO_REWIND_AVAILABLE");return{profileId:String(row.profile_id)}}
export async function boostProfile(){const supabase=createClient(),{data,error}=await supabase.rpc("fc_activate_profile_boost");if(error)throw error;const row=Array.isArray(data)?data[0]:data;if(!row)throw new Error("BOOST_UNAVAILABLE");return{startedAt:String(row.started_at),expiresAt:String(row.expires_at),cooldownUntil:String(row.cooldown_until)}}
