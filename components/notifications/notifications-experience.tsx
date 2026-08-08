"use client";

import {useRouter} from "next/navigation";
import {useEffect,useMemo,useState} from "react";
import {filterNotifications} from "@/lib/notifications/notification-service";
import type {FlirtschatNotification,NotificationFilter} from "@/lib/notifications/notification-types";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {useNotifications} from "./notification-provider";
import {NotificationsHeader} from "./notifications-header";
import {NotificationTabs} from "./notification-tabs";
import {NotificationList} from "./notification-list";

export function NotificationsExperience(){
  const router=useRouter(),{items,unreadCount,refresh,markRead,markAllRead,remove}=useNotifications(),[ready,setReady]=useState(false),[error,setError]=useState(false),[filter,setFilter]=useState<NotificationFilter>("all");
  useEffect(()=>{void refresh().catch(()=>setError(true)).finally(()=>setReady(true))},[refresh]);
  const visible=useMemo(()=>filterNotifications(items,filter),[filter,items]),unread=(value:NotificationFilter)=>filterNotifications(items,value).filter(item=>!item.read).length;
  const open=async(item:FlirtschatNotification)=>{if(!item.read)await markRead(item.id);router.push(item.href)};
  if(!ready)return <main className="fc-notif-loading">Loading notifications...</main>;
  if(error)return <main className="fc-notif-loading"><span>Notifications couldn&apos;t load.</span><button type="button" onClick={()=>{setError(false);void refresh()}}>Retry</button></main>;
  return <main className="fc-notif-page"><div className="fc-notif-shell"><NotificationsHeader unread={unreadCount} onMarkAll={()=>void markAllRead()}/><NotificationTabs value={filter} onChange={setFilter} count={unread}/><NotificationList items={visible} onOpen={item=>void open(item)} onDelete={id=>void remove(id)}/></div><AppBottomNav active="none"/></main>;
}
