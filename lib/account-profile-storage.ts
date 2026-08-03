import {accountProfileDefaults,type AccountProfileValues} from "./account-profile-schema";

export const ACCOUNT_PROFILE_KEY="flirtschat:account-profile";

export function loadAccountProfile():AccountProfileValues{
  if(typeof window==="undefined")return accountProfileDefaults;
  try{return{...accountProfileDefaults,...JSON.parse(localStorage.getItem(ACCOUNT_PROFILE_KEY)??"{}") as Partial<AccountProfileValues>}}catch{return accountProfileDefaults}
}

export function saveAccountProfile(value:AccountProfileValues){
  localStorage.setItem(ACCOUNT_PROFILE_KEY,JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("flirtschat:account-profile-change",{detail:value}));
}
