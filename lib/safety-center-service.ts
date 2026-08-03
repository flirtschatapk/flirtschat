export type SafetyChecklist={meetPublic:boolean;tellFriend:boolean;ownTransport:boolean;protectDetails:boolean;trustInstincts:boolean};
export type SafetyContact={name:string;phone:string};
export type SafetyCheckIn={endsAt:string;minutes:number}|null;
export type SafetyReport={id:string;profileId:string;reason:string;createdAt:string;status:"Under review"|"Resolved"};
export type SafetyState={checklist:SafetyChecklist;contact:SafetyContact;checkIn:SafetyCheckIn;reports:SafetyReport[]};
export const SAFETY_STATE_KEY="flirtschat:safety-center";
export const SAFETY_STATE_EVENT="flirtschat:safety-center-change";
export const defaultSafetyState:SafetyState={checklist:{meetPublic:false,tellFriend:false,ownTransport:false,protectDetails:false,trustInstincts:false},contact:{name:"",phone:""},checkIn:null,reports:[]};
export function loadSafetyState():SafetyState{if(typeof window==="undefined")return defaultSafetyState;try{const saved=JSON.parse(localStorage.getItem(SAFETY_STATE_KEY)??"{}") as Partial<SafetyState>;return{...defaultSafetyState,...saved,checklist:{...defaultSafetyState.checklist,...saved.checklist},contact:{...defaultSafetyState.contact,...saved.contact},reports:Array.isArray(saved.reports)?saved.reports:[]}}catch{return defaultSafetyState}}
export function saveSafetyState(value:SafetyState){localStorage.setItem(SAFETY_STATE_KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent(SAFETY_STATE_EVENT,{detail:value}));return value}
export function addSafetyReport(profileId:string,reason:string){const state=loadSafetyState();const report:SafetyReport={id:`report-${Date.now()}`,profileId,reason,createdAt:new Date().toISOString(),status:"Under review"};saveSafetyState({...state,reports:[report,...state.reports]});return report}
