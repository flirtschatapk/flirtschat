import type{ChatMessage}from"./chat-types";
const KEY="flirtschat:offline-message-queue";
export function readOfflineQueue():ChatMessage[]{if(typeof window==="undefined")return[];try{return JSON.parse(localStorage.getItem(KEY)??"[]")}catch{return[]}}
export function queueOfflineMessage(message:ChatMessage){const next=[...readOfflineQueue(),message];localStorage.setItem(KEY,JSON.stringify(next));return next}
export function clearOfflineQueue(){localStorage.removeItem(KEY)}
