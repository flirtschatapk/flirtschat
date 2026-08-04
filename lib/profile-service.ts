import type {CurrentProfile,CurrentProfileUpdate} from "@/lib/profile-types";
async function request(method:"GET"|"PATCH",payload?:CurrentProfileUpdate){const response=await fetch("/api/profile/me",{method,headers:payload?{"content-type":"application/json"}:undefined,body:payload?JSON.stringify(payload):undefined,cache:"no-store"});const result=await response.json() as {ok?:boolean;profile?:CurrentProfile;error?:{message:string}};if(!response.ok||!result.profile)throw new Error(result.error?.message??"We couldn't load your profile.");return result.profile}
export const getCurrentProfile=()=>request("GET");
export const refreshCurrentProfile=()=>request("GET");
export const updateCurrentProfile=(payload:CurrentProfileUpdate)=>request("PATCH",payload);
export async function createMinimumProfile(){await fetch("/api/auth/destination",{method:"POST",cache:"no-store"});return request("GET")}
export async function completeOnboarding(payload:Record<string,unknown>){const response=await fetch("/api/profile/onboarding",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const result=await response.json() as {profile?:CurrentProfile;error?:{message:string}};if(!response.ok||!result.profile)throw new Error(result.error?.message??"We couldn't save your profile.");return result.profile}
export async function getProfileByUserId(userId:string){const current=await request("GET");return current.id===userId?current:null}
export async function getPrimaryProfilePhoto(userId:string){return(await getProfileByUserId(userId))?.primaryPhotoUrl??null}
