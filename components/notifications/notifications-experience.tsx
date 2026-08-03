"use client";
import{useRouter}from"next/navigation";
import{useEffect,useMemo,useState}from"react";
import{isMockAuthenticated}from"@/lib/mock-auth-guard";
import{loadOnboarding}from"@/lib/onboarding-storage";
import{deleteNotification,filterNotifications,loadNotifications,markAllAsRead,markAsRead,saveNotifications}from"@/lib/notifications/notification-service";
import type{FlirtschatNotification,NotificationFilter}from"@/lib/notifications/notification-types";
import{NotificationsHeader}from"./notifications-header";
import{NotificationTabs}from"./notification-tabs";
import{NotificationList}from"./notification-list";
import{AppBottomNav}from"@/components/app-bottom-nav";

export function NotificationsExperience(){const router=useRouter(),[ready,setReady]=useState(false),[filter,setFilter]=useState<NotificationFilter>("all"),[items,setItems]=useState<FlirtschatNotification[]>([]);useEffect(()=>{if(!isMockAuthenticated()){router.replace("/login");return}if(!loadOnboarding().completed){router.replace("/onboarding");return}setItems(loadNotifications());setReady(true)},[router]);const update=(next:FlirtschatNotification[])=>{setItems(next);saveNotifications(next)};const visible=useMemo(()=>filterNotifications(items,filter),[filter,items]);const unread=(value:NotificationFilter)=>filterNotifications(items,value).filter(item=>!item.read).length;const open=(item:FlirtschatNotification)=>{update(markAsRead(items,item.id));router.push(item.href)};if(!ready)return <main className="fc-notif-loading">Loading notifications…</main>;return <main className="fc-notif-page"><div className="fc-notif-shell"><NotificationsHeader unread={unread("all")} onMarkAll={()=>update(markAllAsRead(items))}/><NotificationTabs value={filter} onChange={setFilter} count={unread}/><NotificationList items={visible} onOpen={open} onDelete={id=>update(deleteNotification(items,id))}/></div><AppBottomNav active="none"/></main>}
