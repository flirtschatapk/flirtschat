import {GalleryHorizontalEnd, Globe2, Heart, MessageCircle, Settings} from "lucide-react";
import {ChatUnreadBadge} from "@/components/chat/chat-unread-badge";

type NavItem = "global" | "swipe" | "matches" | "chat" | "settings";
const items: {id:NavItem;label:string;href:string;icon:React.ReactNode}[] = [
  {id:"global",label:"Global",href:"/dashboard",icon:<Globe2/>},
  {id:"swipe",label:"Swipe",href:"/discover",icon:<GalleryHorizontalEnd/>},
  {id:"chat",label:"Chats",href:"/chats",icon:<MessageCircle/>},
  {id:"matches",label:"Matches",href:"/matches",icon:<Heart/>},
  {id:"settings",label:"Settings",href:"/settings",icon:<Settings/>},
];

export function AppBottomNav({active}: {active: NavItem | "none"}) {
  return <nav className="fc-bottom-nav fc-icon-only-nav" aria-label="Main mobile navigation">
    {items.map(({id,label,href,icon}) => <a
      className={active === id ? "active" : ""}
      href={href}
      key={id}
      aria-label={label}
      title={label}
      aria-current={active === id ? "page" : undefined}
    ><span>{icon}{id==="chat"&&<ChatUnreadBadge/>}</span></a>)}
  </nav>;
}
