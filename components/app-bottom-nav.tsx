import {GalleryHorizontalEnd, Globe2, Heart, MessageCircle, Settings} from "lucide-react";
import {NotificationBadge} from "@/components/notifications/notification-badge";

type NavItem = "global" | "swipe" | "matches" | "chat" | "settings";
const items: [NavItem, string, string, React.ReactNode][] = [
  ["global", "Global", "/dashboard", <Globe2 key="global"/>],
  ["swipe", "Swipe", "/discover", <GalleryHorizontalEnd key="swipe"/>],
  ["chat", "Chats", "/chats", <MessageCircle key="chat"/>],
  ["matches", "Matches", "/matches", <Heart key="matches"/>],
  ["settings", "Settings", "/settings", <Settings key="settings"/>],
];

export function AppBottomNav({active}: {active: NavItem | "none"}) {
  return <nav className="fc-bottom-nav fc-icon-only-nav" aria-label="Main mobile navigation">
    {items.map(([id, label, href, icon]) => <a
      className={active === id ? "active" : ""}
      href={href}
      key={id}
      aria-label={label}
      title={label}
      aria-current={active === id ? "page" : undefined}
    ><span>{icon}{id==="chat"&&<NotificationBadge/>}</span></a>)}
  </nav>;
}
