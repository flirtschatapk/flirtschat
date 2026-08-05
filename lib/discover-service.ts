import {createClient} from "@/lib/supabase/client";
import type {DiscoverFilters,DiscoverProfile,DiscoverTab} from "./discover-types";

type RpcRow={id:string;display_name:string|null;bio:string|null;gender:string|null;date_of_birth:string|null;country:string|null;city:string|null;languages:string[]|null;interests:string[]|null;relationship_goal:string|null;verified:boolean|null;premium:boolean|null;last_seen_at:string|null;created_at:string|null;photo_keys:string[]|null};
type FlexibleRow=Record<string,unknown>&{id?:unknown};

const age=(dob:string|null)=>dob?Math.max(18,Math.floor((Date.now()-new Date(dob).getTime())/31557600000)):18;
const text=(value:unknown)=>typeof value==="string"?value.trim():"";
const stringArray=(value:unknown)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"&&Boolean(item.trim())):[];
const explicitFalse=(row:FlexibleRow,...keys:string[])=>keys.some(key=>key in row&&row[key]===false);
const hidden=(row:FlexibleRow)=>explicitFalse(row,"profile_visible","is_visible","active","is_active","onboarding_completed","profile_completed")||["hidden","deactivated","deleted","suspended","banned"].includes(text(row.status).toLowerCase())||Boolean(row.deleted_at)||Boolean(row.deactivated_at);

function fromRpc(row:RpcRow):DiscoverProfile{
  return{id:row.id,name:text(row.display_name)||"New user",username:null,age:age(row.date_of_birth),gender:row.gender==="Man"?"Man":"Woman",city:text(row.city)||"Nearby",country:text(row.country),online:row.last_seen_at?Date.now()-new Date(row.last_seen_at).getTime()<300000:false,isNew:row.created_at?Date.now()-new Date(row.created_at).getTime()<604800000:false,premium:Boolean(row.premium),verified:Boolean(row.verified),bio:text(row.bio),interests:stringArray(row.interests),photos:stringArray(row.photo_keys).map(key=>`/api/media/profile-photo?key=${encodeURIComponent(key)}`),relationshipGoal:text(row.relationship_goal)||"Still exploring",languages:stringArray(row.languages),distance:0};
}

function fromFlexible(row:FlexibleRow):DiscoverProfile|null{
  const id=text(row.id);if(!id||hidden(row))return null;
  const username=text(row.username)||null,displayName=text(row.full_name)||username||text(row.display_name)||"New user",avatar=text(row.avatar_url)||text(row.picture)||null;
  const dob=text(row.date_of_birth)||text(row.birth_date)||null,created=text(row.created_at)||null,lastSeen=text(row.last_seen_at)||text(row.updated_at)||null;
  return{id,name:displayName,username,age:age(dob),gender:text(row.gender)==="Man"?"Man":"Woman",city:text(row.city)||text(row.location)||"Nearby",country:text(row.country),online:lastSeen?Date.now()-new Date(lastSeen).getTime()<300000:false,isNew:created?Date.now()-new Date(created).getTime()<604800000:false,premium:Boolean(row.premium||row.is_premium),verified:Boolean(row.verified||row.is_verified),bio:text(row.bio),interests:stringArray(row.interests),photos:avatar?[avatar]:[],relationshipGoal:text(row.relationship_goal)||text(row.looking_for)||"Still exploring",languages:stringArray(row.languages),distance:0};
}

async function legacyProfiles(currentUserId:string){
  const supabase=createClient(),{data,error}=await supabase.from("profiles").select("*");
  if(error)throw error;
  const blocked=new Set<string>();
  const{data:blocks}=await supabase.from("fc_blocks").select("blocker_id,blocked_id").or(`blocker_id.eq.${currentUserId},blocked_id.eq.${currentUserId}`);
  for(const row of blocks??[])blocked.add(row.blocker_id===currentUserId?row.blocked_id:row.blocker_id);
  return((data??[]) as FlexibleRow[]).filter(row=>text(row.id)!==currentUserId&&!blocked.has(text(row.id))).map(fromFlexible).filter((profile):profile is DiscoverProfile=>Boolean(profile));
}

export async function getProfiles(tab:DiscoverTab="all",filters?:DiscoverFilters):Promise<DiscoverProfile[]>{
  const supabase=createClient(),{data:{user},error:userError}=await supabase.auth.getUser();if(userError||!user)throw userError??new Error("Authentication required");
  const{data,error}=await supabase.rpc("fc_discover_profiles");
  let profiles=!error&&data?.length?((data??[]) as RpcRow[]).map(fromRpc):await legacyProfiles(user.id);
  profiles=profiles.filter(profile=>(tab!=="new"||profile.isNew)&&(tab!=="verified"||profile.verified)&&(tab!=="premium"||profile.premium)&&(!filters||profile.age>=filters.minAge&&profile.age<=filters.maxAge&&(filters.showMe==="Everyone"||filters.showMe==="Women"&&profile.gender==="Woman"||filters.showMe==="Men"&&profile.gender==="Man")&&(!filters.onlineOnly||profile.online)&&(!filters.verifiedOnly||profile.verified)&&(!filters.premiumOnly||profile.premium)&&(!filters.relationshipGoal||profile.relationshipGoal===filters.relationshipGoal)&&(!filters.country||profile.country===filters.country)&&(filters.interests.length===0||filters.interests.some(item=>profile.interests.includes(item)))));
  return profiles;
}

async function swipe(target:string,swipe_action:"like"|"pass"|"super_like"){const supabase=createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sign in required");const{data,error}=await supabase.rpc("fc_swipe_and_match",{target,swipe_action});if(error)throw error;const result=Array.isArray(data)?data[0]:data;return{matched:Boolean(result?.matched),matchId:typeof result?.match_id==="string"?result.match_id:null}}
export async function likeProfile(id:string){return swipe(id,"like")}
export async function dislikeProfile(id:string){await swipe(id,"pass");return{profileId:id}}
export async function superLikeProfile(id:string){const result=await swipe(id,"super_like");return{...result,profileId:id}}
export async function rewindProfile(){throw new Error("Rewind is unavailable after syncing")}
export async function boostProfile(){return{boosted:true}}
