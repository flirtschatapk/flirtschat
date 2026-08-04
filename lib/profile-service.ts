import type {CurrentProfile,CurrentProfileUpdate} from "@/lib/profile-types";
export class ProfileRequestError extends Error{constructor(message:string,public readonly status:number){super(message);this.name="ProfileRequestError"}}
async function request(method:"GET"|"PATCH",payload?:CurrentProfileUpdate){const response=await fetch("/api/profile/me",{method,headers:payload?{"content-type":"application/json"}:undefined,body:payload?JSON.stringify(payload):undefined,cache:"no-store",credentials:"same-origin"});const result=await response.json().catch(()=>null) as {ok?:boolean;profile?:CurrentProfile;error?:string|{message:string}}|null;if(!response.ok||!result?.profile){const message=typeof result?.error==="string"?result.error:result?.error?.message;throw new ProfileRequestError(message??"We couldn't load your profile.",response.status)}return result.profile}
export const getCurrentProfile=()=>request("GET");
export const refreshCurrentProfile=()=>request("GET");
export const updateCurrentProfile=(payload:CurrentProfileUpdate)=>request("PATCH",payload);
export async function createMinimumProfile(){await fetch("/api/auth/destination",{method:"POST",cache:"no-store"});return request("GET")}
export async function completeOnboarding(payload:Record<string,unknown>){const response=await fetch("/api/profile/onboarding",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload)});const result=await response.json() as {profile?:CurrentProfile;error?:{message:string}};if(!response.ok||!result.profile)throw new Error(result.error?.message??"We couldn't save your profile.");return result.profile}
export async function getProfileByUserId(userId:string){const current=await request("GET");return current.id===userId?current:null}
export async function getPrimaryProfilePhoto(userId:string){return(await getProfileByUserId(userId))?.primaryPhotoUrl??null}
