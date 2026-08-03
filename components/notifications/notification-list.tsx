import{motion,useReducedMotion}from"framer-motion";
import type{FlirtschatNotification}from"@/lib/notifications/notification-types";
import{NotificationCard}from"./notification-card";
import{NotificationEmpty}from"./notification-empty";
export function NotificationList({items,onOpen,onDelete}:{items:FlirtschatNotification[];onOpen:(item:FlirtschatNotification)=>void;onDelete:(id:string)=>void}){const reduce=useReducedMotion();return <motion.section className="fc-notif-list" initial={reduce?false:{opacity:0,y:8}} animate={{opacity:1,y:0}}>{items.length?items.map((item,index)=><motion.div initial={reduce?false:{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:index*.035}} key={item.id}><NotificationCard notice={item} onOpen={()=>onOpen(item)} onDelete={()=>onDelete(item.id)}/></motion.div>):<NotificationEmpty/>}</motion.section>}
