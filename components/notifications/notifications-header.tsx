"use client";
import{ArrowLeft,Bell,Heart}from"lucide-react";
import{useRouter}from"next/navigation";
import{MarkReadButton}from"./mark-read-button";
import{NotificationBadge}from"./notification-badge";
export function NotificationsHeader({unread,onMarkAll}:{unread:number;onMarkAll:()=>void}){const router=useRouter();return <header className="fc-notif-header"><button type="button" className="fc-notif-back-dashboard" onClick={()=>router.push("/dashboard")}><ArrowLeft/><span>Back to Dashboard</span></button><div><h1>Notifications</h1><p>Stay updated with your matches and messages <Heart/></p></div><div><MarkReadButton onClick={onMarkAll} disabled={unread===0}/><span className="fc-notif-bell"><Bell/><NotificationBadge/></span></div></header>}
