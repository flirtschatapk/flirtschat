export type PrivacyAudience="everyone"|"matches"|"nobody";
export type PrivacySettings={profileVisibility:PrivacyAudience;messagePermission:Exclude<PrivacyAudience,"nobody">;showOnlineStatus:boolean;showLastActive:boolean;showDistance:boolean;showAge:boolean;readReceipts:boolean;appearInSearch:boolean;allowProfileSharing:boolean;personalizedDiscovery:boolean};
export const PRIVACY_SETTINGS_KEY="flirtschat:privacy-settings";
export const PRIVACY_SETTINGS_EVENT="flirtschat:privacy-settings-change";
export const defaultPrivacySettings:PrivacySettings={profileVisibility:"everyone",messagePermission:"matches",showOnlineStatus:true,showLastActive:true,showDistance:true,showAge:true,readReceipts:true,appearInSearch:true,allowProfileSharing:true,personalizedDiscovery:true};
export function loadPrivacySettings():PrivacySettings{if(typeof window==="undefined")return defaultPrivacySettings;try{return{...defaultPrivacySettings,...JSON.parse(localStorage.getItem(PRIVACY_SETTINGS_KEY)??"{}") as Partial<PrivacySettings>}}catch{return defaultPrivacySettings}}
export function savePrivacySettings(value:PrivacySettings){localStorage.setItem(PRIVACY_SETTINGS_KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent(PRIVACY_SETTINGS_EVENT,{detail:value}));return value}
export function resetPrivacySettings(){return savePrivacySettings(defaultPrivacySettings)}
export function canViewMyProfile(viewer:"match"|"other"){const value=loadPrivacySettings();return value.profileVisibility==="everyone"||(value.profileVisibility==="matches"&&viewer==="match")}
export function canMessageMe(viewer:"match"|"other"){const value=loadPrivacySettings();return value.messagePermission==="everyone"||viewer==="match"}
