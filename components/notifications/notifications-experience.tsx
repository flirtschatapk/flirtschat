"use client";
import{useRouter}from"next/navigation";
import{useCallback,useEffect,useMemo,useState}from"react";
import{createClient}from"@/lib/supabase/client";
import{deleteNotificationRemote,filterNotifications,loadNotifications,markAllNotificationsRead,markNotificationRead}from"@/lib/notifications/notification-service";
import type{FlirtschatNotification,NotificationFilter}from"@/lib/notifications/notification-types";
import{NotificationsHeader}from"./notifications-header";
import{NotificationTabs}from"./notification-tabs";
import{NotificationList}from"./notification-list";
import{AppBottomNav}from"@/components/app-bottom-nav";

export function NotificationsExperience(){
  const router=useRouter(),[ready,setReady]=useState(false),[error,setError]=useState(false),[filter,setFilter]=useState<NotificationFilter>("all"),[items,setItems]=useState<FlirtschatNotification[]>([]);
  const load=useCallback(async()=>{setError(false);try{setItems(await loadNotifications())}catch(reason){console.error("[notifications] query failed",{code:typeof reason==="object"&&reason&&"code"in reason?String(reason.code):"unknown"});setError(true)}finally{setReady(true)}},[]);
  useEffect(()=>{void load();const supabase=createClient();let channel:ReturnType<typeof supabase.channel>|null=null;void supabase.auth.getUser().then(({data})=>{if(!data.user)return;channel=supabase.channel(`notifications-${data.user.id}`).on("postgres_changes",{event:"*",schema:"public",table:"fc_notifications",filter:`user_id=eq.${data.user.id}`},()=>void load()).subscribe()});return()=>{if(channel)void supabase.removeChannel(channel)}},[load]);
  const visible=useMemo(()=>filterNotifications(items,filter),[filter,items]),unread=(value:NotificationFilter)=>filterNotifications(items,value).filter(item=>!item.read).length;
  const open=async(item:FlirtschatNotification)=>{if(!item.read){setItems(current=>current.map(row=>row.id===item.id?{...row,read:true}:row));try{await markNotificationRead(item.id)}catch{void load()}}router.push(item.href)};
  const markAll=async()=>{setItems(current=>current.map(item=>({...item,read:true})));try{await markAllNotificationsRead()}catch{void load()}};
  const remove=async(id:string)=>{setItems(current=>current.filter(item=>item.id!==id));try{await deleteNotificationRemote(id)}catch{void load()}};
  if(!ready)return <main className="fc-notif-loading">Loading notifications…</main>;
  if(error)return <main className="fc-notif-loading"><span>Notifications couldn&apos;t load.</span><button type="button" onClick={()=>void load()}>Retry</button></main>;
  return <main className="fc-notif-page"><div className="fc-notif-shell"><NotificationsHeader unread={unread("all")} onMarkAll={()=>void markAll()}/><NotificationTabs value={filter} onChange={setFilter} count={unread}/><NotificationList items={visible} onOpen={item=>void open(item)} onDelete={id=>void remove(id)}/></div><AppBottomNav active="none"/></main>;
}
