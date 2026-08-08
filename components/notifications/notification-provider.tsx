"use client";

import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
import {deleteNotificationRemote,loadNotifications,markAllNotificationsRead,markNotificationRead} from "@/lib/notifications/notification-service";
import type {FlirtschatNotification} from "@/lib/notifications/notification-types";

type NotificationContextValue={items:FlirtschatNotification[];unreadCount:number;refresh:()=>Promise<void>;markRead:(id:string)=>Promise<void>;markAllRead:()=>Promise<void>;remove:(id:string)=>Promise<void>};
const NotificationContext=createContext<NotificationContextValue|null>(null);

export function NotificationProvider({children}:{children:React.ReactNode}){
  const router=useRouter(),[items,setItems]=useState<FlirtschatNotification[]>([]),[toast,setToast]=useState<FlirtschatNotification|null>(null),activeChannel=useRef<ReturnType<ReturnType<typeof createClient>["channel"]>|null>(null),lastIds=useRef(new Set<string>());
  const refresh=useCallback(async()=>{try{const next=await loadNotifications();lastIds.current=new Set(next.map(item=>item.id));setItems(next)}catch{setItems([])}},[]);
  useEffect(()=>{const supabase=createClient();let disposed=false;let unsubscribe:ReturnType<typeof supabase.auth.onAuthStateChange>["data"]["subscription"]|null=null;const cleanup=()=>{if(activeChannel.current){void supabase.removeChannel(activeChannel.current);activeChannel.current=null}};const connect=async(userId:string)=>{cleanup();if(disposed)return;await refresh();if(disposed)return;activeChannel.current=supabase.channel(`user-notifications-${userId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"fc_notifications",filter:`user_id=eq.${userId}`},async payload=>{const id=String((payload.new as {id?:string}).id??"");if(id&&lastIds.current.has(id))return;await refresh();if(id){const next=await loadNotifications().catch(()=>[]),notice=next.find(item=>item.id===id);if(notice){setToast(notice);window.setTimeout(()=>setToast(current=>current?.id===id?null:current),4500)}}}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"fc_notifications",filter:`user_id=eq.${userId}`},()=>void refresh()).subscribe()};const start=async()=>{const{data}=await supabase.auth.getUser();if(data.user)await connect(data.user.id)};void start();unsubscribe=supabase.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){cleanup();lastIds.current.clear();setItems([]);return}if(session?.user)void connect(session.user.id)}).data.subscription;return()=>{disposed=true;cleanup();unsubscribe?.unsubscribe()}},[refresh]);
  useEffect(()=>{if(!toast)return;return()=>undefined},[toast]);
  const markRead=useCallback(async(id:string)=>{setItems(current=>current.map(item=>item.id===id?{...item,read:true}:item));try{await markNotificationRead(id)}catch{await refresh()}},[refresh]);
  const markAllRead=useCallback(async()=>{setItems(current=>current.map(item=>({...item,read:true})));try{await markAllNotificationsRead()}catch{await refresh()}},[refresh]);
  const remove=useCallback(async(id:string)=>{setItems(current=>current.filter(item=>item.id!==id));try{await deleteNotificationRemote(id)}catch{await refresh()}},[refresh]);
  const value=useMemo(()=>({items,unreadCount:items.filter(item=>!item.read).length,refresh,markRead,markAllRead,remove}),[items,markAllRead,markRead,refresh,remove]);
  return <NotificationContext.Provider value={value}>{children}{toast&&<button type="button" className="fc-notification-toast" onClick={()=>{setToast(null);if(!toast.read)void markRead(toast.id);router.push(toast.href)}}><span><strong>{toast.title}</strong><small>{toast.description||"Open notifications"}</small></span></button>}</NotificationContext.Provider>;
}

export function useNotifications(){const value=useContext(NotificationContext);if(!value)throw new Error("useNotifications must be used within NotificationProvider");return value}
