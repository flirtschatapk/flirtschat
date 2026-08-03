import { onboardingDefaults,type OnboardingValues } from "./onboarding-schema";
/* eslint-disable @typescript-eslint/no-unused-vars */
export const ONBOARDING_KEY="flirtschat:onboarding";
export type SavedOnboarding={step:number;completed:boolean;data:OnboardingValues};
export function loadOnboarding():SavedOnboarding{if(typeof window==="undefined")return{step:1,completed:false,data:onboardingDefaults};try{const raw=localStorage.getItem(ONBOARDING_KEY);if(!raw)return{step:1,completed:false,data:onboardingDefaults};const saved=JSON.parse(raw) as Partial<SavedOnboarding>;return{step:Math.min(4,Math.max(1,saved.step??1)),completed:Boolean(saved.completed),data:{...onboardingDefaults,...saved.data}}}catch{return{step:1,completed:false,data:onboardingDefaults}}}
export function saveOnboarding(value:SavedOnboarding){try{localStorage.setItem(ONBOARDING_KEY,JSON.stringify(value))}catch{localStorage.setItem(ONBOARDING_KEY,JSON.stringify({...value,data:{...value.data,photos:value.data.photos.map(({preview:_,...photo})=>({...photo,preview:""}))}}))}}
