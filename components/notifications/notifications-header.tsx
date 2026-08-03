import{Bell,Heart}from"lucide-react";
import{MarkReadButton}from"./mark-read-button";
export function NotificationsHeader({unread,onMarkAll}:{unread:number;onMarkAll:()=>void}){return <header className="fc-notif-header"><div><h1>Notifications</h1><p>Stay updated with your matches and messages <Heart/></p></div><div><MarkReadButton onClick={onMarkAll} disabled={unread===0}/><span className="fc-notif-bell"><Bell/>{unread>0&&<b>{unread}</b>}</span></div></header>}
