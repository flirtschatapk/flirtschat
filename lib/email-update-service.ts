export type EmailUpdateCategory="matches"|"messages"|"safety"|"product"|"digest";
export type EmailUpdateFrequency="instant"|"daily"|"weekly";
export type EmailUpdatePreferences={enabled:boolean;categories:Record<EmailUpdateCategory,boolean>;frequency:EmailUpdateFrequency;updatedAt:string};
export const EMAIL_UPDATES_KEY="flirtschat:email-updates";
export const EMAIL_UPDATES_EVENT="flirtschat:email-updates-change";
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
const defaults:EmailUpdatePreferences={enabled:true,categories:{matches:true,messages:true,safety:true,product:false,digest:true},frequency:"daily",updatedAt:""};

export function loadEmailUpdatePreferences():EmailUpdatePreferences{if(typeof window==="undefined")return defaults;try{return{...defaults,...JSON.parse(localStorage.getItem(EMAIL_UPDATES_KEY)??"{}") as Partial<EmailUpdatePreferences>}}catch{return defaults}}
export async function saveEmailUpdatePreferences(next:EmailUpdatePreferences){await wait(320);const value={...next,updatedAt:new Date().toISOString()};localStorage.setItem(EMAIL_UPDATES_KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent(EMAIL_UPDATES_EVENT,{detail:value}));return value}
export async function setEmailUpdatesEnabled(enabled:boolean){return saveEmailUpdatePreferences({...loadEmailUpdatePreferences(),enabled})}
