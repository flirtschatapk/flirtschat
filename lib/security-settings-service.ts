export type SecuritySession={id:string;device:string;browser:string;location:string;lastActive:string;current:boolean;trusted:boolean};
export type SecurityState={twoFactor:boolean;loginAlerts:boolean;passkey:boolean;sessions:SecuritySession[];activity:{id:string;title:string;detail:string;time:string;safe:boolean}[]};

const KEY="flirtschat:security-settings";
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
export const MOCK_2FA_CODE="123456";
const defaults:SecurityState={twoFactor:false,loginAlerts:true,passkey:false,sessions:[{id:"current",device:"Windows PC",browser:"Chrome · Current session",location:"Los Angeles, United States",lastActive:"Active now",current:true,trusted:true},{id:"iphone",device:"iPhone 16",browser:"Safari Mobile",location:"Los Angeles, United States",lastActive:"2 hours ago",current:false,trusted:true},{id:"tablet",device:"Galaxy Tab",browser:"Samsung Internet",location:"San Diego, United States",lastActive:"3 days ago",current:false,trusted:false}],activity:[{id:"password",title:"Password checked",detail:"Account security review completed",time:"Today",safe:true},{id:"login",title:"New login",detail:"Chrome on Windows · Los Angeles",time:"Today, 9:42 AM",safe:true},{id:"failed",title:"Blocked login attempt",detail:"Unknown browser · Dhaka",time:"Yesterday",safe:false}]};

export function loadSecurityState():SecurityState{if(typeof window==="undefined")return defaults;try{return{...defaults,...JSON.parse(localStorage.getItem(KEY)??"{}") as Partial<SecurityState>}}catch{return defaults}}
function save(state:SecurityState){localStorage.setItem(KEY,JSON.stringify(state));window.dispatchEvent(new CustomEvent("flirtschat:security-change",{detail:state}));return state}
export async function setLoginAlerts(value:boolean){await wait(300);return save({...loadSecurityState(),loginAlerts:value})}
export async function verifyTwoFactor(code:string){await wait(550);if(code!==MOCK_2FA_CODE)throw new Error("Incorrect verification code");return save({...loadSecurityState(),twoFactor:true})}
export async function disableTwoFactor(){await wait(420);return save({...loadSecurityState(),twoFactor:false})}
export async function registerPasskey(){await wait(650);return save({...loadSecurityState(),passkey:true})}
export async function removePasskey(){await wait(400);return save({...loadSecurityState(),passkey:false})}
export async function revokeSession(id:string){await wait(450);const state=loadSecurityState();return save({...state,sessions:state.sessions.filter(session=>session.id!==id)})}
export async function revokeOtherSessions(){await wait(600);const state=loadSecurityState();return save({...state,sessions:state.sessions.filter(session=>session.current)})}
export async function toggleTrustedSession(id:string){await wait(260);const state=loadSecurityState();return save({...state,sessions:state.sessions.map(session=>session.id===id?{...session,trusted:!session.trusted}:session)})}
