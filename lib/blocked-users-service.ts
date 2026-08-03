export type BlockedUserRecord={profileId:string;blockedAt:string;reason:string};
export const BLOCKED_USERS_KEY="flirtschat:blocked-profiles";
export const BLOCKED_USERS_EVENT="flirtschat:blocked-users-change";
function normalize(value:unknown):BlockedUserRecord[]{if(!Array.isArray(value))return[];return value.flatMap(item=>typeof item==="string"?[{profileId:item,blockedAt:new Date().toISOString(),reason:"Blocked from profile"}]:item&&typeof item==="object"&&"profileId" in item?[item as BlockedUserRecord]:[])}
export function loadBlockedUsers():BlockedUserRecord[]{if(typeof window==="undefined")return[];try{return normalize(JSON.parse(localStorage.getItem(BLOCKED_USERS_KEY)??"[]"))}catch{return[]}}
function commit(records:BlockedUserRecord[]){localStorage.setItem(BLOCKED_USERS_KEY,JSON.stringify(records));window.dispatchEvent(new CustomEvent(BLOCKED_USERS_EVENT,{detail:records}));return records}
export function addBlockedUser(profileId:string,reason="Blocked from profile"){const current=loadBlockedUsers();if(current.some(item=>item.profileId===profileId))return current;return commit([{profileId,reason,blockedAt:new Date().toISOString()},...current])}
export function unblockUser(profileId:string){return commit(loadBlockedUsers().filter(item=>item.profileId!==profileId))}
export function unblockAllUsers(){return commit([])}
export function isProfileBlocked(profileId:string){const normalized=profileId.replace(/-global$/i,"");return loadBlockedUsers().some(item=>item.profileId.replace(/-global$/i,"")===normalized)}
