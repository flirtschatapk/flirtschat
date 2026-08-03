export type StoredChatMessage = {id:number;mine:boolean;text:string;time:string};
type PreviewMap = Record<string,{text:string;time:string}>;
const messagesKey=(profileId:string)=>`flirtschat:chat:${profileId}`;
const PREVIEWS_KEY="flirtschat:chat-previews";
export function loadChatMessages(profileId:string,fallback:StoredChatMessage[]){if(typeof window==="undefined")return fallback;try{const saved=JSON.parse(localStorage.getItem(messagesKey(profileId))??"null");return Array.isArray(saved)?saved:fallback}catch{return fallback}}
export function saveChatMessages(profileId:string,messages:StoredChatMessage[]){localStorage.setItem(messagesKey(profileId),JSON.stringify(messages));const last=messages.at(-1);if(last){const previews=loadChatPreviews();previews[profileId]={text:`${last.mine?"You: ":""}${last.text}`,time:last.time};localStorage.setItem(PREVIEWS_KEY,JSON.stringify(previews));window.dispatchEvent(new CustomEvent("flirtschat:chat-change",{detail:{profileId}}))}}
export function loadChatPreviews():PreviewMap{if(typeof window==="undefined")return{};try{return JSON.parse(localStorage.getItem(PREVIEWS_KEY)??"{}") as PreviewMap}catch{return{}}}
