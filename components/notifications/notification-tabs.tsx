import{AtSign,Bell,Heart,MessageCircle,Sparkles}from"lucide-react";
import type{NotificationFilter}from"@/lib/notifications/notification-types";
const tabs:[NotificationFilter,string][]=[["all","All"],["likes","Likes"],["messages","Messages"],["system","System"],["mentions","Mentions"]];
const Icon=({type}:{type:NotificationFilter})=>type==="all"?<Bell/>:type==="likes"?<Heart/>:type==="messages"?<MessageCircle/>:type==="mentions"?<AtSign/>:<Sparkles/>;
export function NotificationTabs({value,onChange,count}:{value:NotificationFilter;onChange:(value:NotificationFilter)=>void;count:(value:NotificationFilter)=>number}){return <div className="fc-notif-tabs" role="tablist" aria-label="Notification categories">{tabs.map(([type,label])=><button role="tab" type="button" aria-selected={value===type} className={value===type?"active":""} onClick={()=>onChange(type)} key={type}><Icon type={type}/><span>{label}</span><b>{count(type)}</b></button>)}</div>}
