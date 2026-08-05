import {createClient} from "@/lib/supabase/client";
import type {FlirtschatNotification,NotificationFilter,NotificationType} from "./notification-types";

const systemTypes=new Set(["gift","visitor","match","system","security","premium"]);
type NotificationRow={id:string;type:string;title:string;body:string|null;href:string|null;read_at:string|null;created_at:string};
const allowedTypes=new Set<NotificationType>(["likes","messages","gift","visitor","match","system","security","premium","mentions"]);
const relativeTime=(value:string)=>{const elapsed=Math.max(0,Date.now()-new Date(value).getTime()),minutes=Math.floor(elapsed/60000);if(minutes<1)return"Just now";if(minutes<60)return`${minutes}m ago`;const hours=Math.floor(minutes/60);if(hours<24)return`${hours}h ago`;return`${Math.floor(hours/24)}d ago`};
const normalize=(row:NotificationRow):FlirtschatNotification=>({id:row.id,type:allowedTypes.has(row.type as NotificationType)?row.type as NotificationType:"system",title:row.title,description:row.body??"",time:relativeTime(row.created_at),read:Boolean(row.read_at),href:row.href?.startsWith("/")?row.href:"/notifications"});

export async function loadNotifications(){const supabase=createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Unauthorized");const{data,error}=await supabase.from("fc_notifications").select("id,type,title,body,href,read_at,created_at").eq("user_id",user.id).order("created_at",{ascending:false});if(error)throw error;return((data??[]) as NotificationRow[]).map(normalize)}
export async function markNotificationRead(id:string){const supabase=createClient(),{error}=await supabase.from("fc_notifications").update({read_at:new Date().toISOString()}).eq("id",id);if(error)throw error}
export async function markAllNotificationsRead(){const supabase=createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Unauthorized");const{error}=await supabase.from("fc_notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);if(error)throw error}
export async function deleteNotificationRemote(id:string){const supabase=createClient(),{error}=await supabase.from("fc_notifications").delete().eq("id",id);if(error)throw error}
export function filterNotifications(items:FlirtschatNotification[],filter:NotificationFilter){if(filter==="all")return items;if(filter==="system")return items.filter(item=>systemTypes.has(item.type));return items.filter(item=>item.type===filter)}
