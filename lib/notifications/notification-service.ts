import{mockNotifications}from"./mock-notifications";
import type{FlirtschatNotification,NotificationFilter}from"./notification-types";

const STORAGE_KEY="flirtschat:notifications";
const systemTypes=new Set(["gift","visitor","match","system","security","premium"]);

export function loadNotifications(){if(process.env.NODE_ENV!=="development")return[];if(typeof window==="undefined")return mockNotifications;try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)??"null")as FlirtschatNotification[]|null;return Array.isArray(saved)?saved:mockNotifications}catch{return mockNotifications}}
export function saveNotifications(items:FlirtschatNotification[]){if(process.env.NODE_ENV==="development"&&typeof window!=="undefined")localStorage.setItem(STORAGE_KEY,JSON.stringify(items))}
export function markAsRead(items:FlirtschatNotification[],id:string){return items.map(item=>item.id===id?{...item,read:true}:item)}
export function markAllAsRead(items:FlirtschatNotification[]){return items.map(item=>({...item,read:true}))}
export function deleteNotification(items:FlirtschatNotification[],id:string){return items.filter(item=>item.id!==id)}
export function filterNotifications(items:FlirtschatNotification[],filter:NotificationFilter){if(filter==="all")return items;if(filter==="system")return items.filter(item=>systemTypes.has(item.type));return items.filter(item=>item.type===filter)}
export function searchNotifications(items:FlirtschatNotification[],query:string){const needle=query.trim().toLowerCase();return needle?items.filter(item=>`${item.title} ${item.description}`.toLowerCase().includes(needle)):items}
