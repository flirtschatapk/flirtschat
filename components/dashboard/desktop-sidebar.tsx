"use client";

import {Crown,GalleryHorizontalEnd,Globe2,Heart,LogOut,MessageCircle,PanelLeftClose,PanelLeftOpen,Settings,X} from "lucide-react";
import Link from "next/link";
import {useEffect,useState} from "react";

type DesktopNavItem="global"|"swipe"|"matches"|"chats"|"settings";

export function DesktopSidebar({mobileOpen=false,onClose,active="global"}:{mobileOpen?:boolean;onClose?:()=>void;active?:DesktopNavItem}) {
  const [collapsed,setCollapsed]=useState(false);
  useEffect(()=>{try{setCollapsed(localStorage.getItem("flirtschat:desktop-sidebar-collapsed")==="true")}catch{}},[]);
  const toggleCollapsed=()=>setCollapsed(current=>{const next=!current;try{localStorage.setItem("flirtschat:desktop-sidebar-collapsed",String(next))}catch{}return next});
  return <>
    {mobileOpen&&<button className="dashboard-sidebar-backdrop" onClick={onClose} aria-label="Close navigation"/>}
    <aside className={`dating-sidebar ${mobileOpen?"mobile-open":""} ${collapsed?"collapsed":"expanded"}`}>
      <div className="dashboard-sidebar-brand"><button className="dashboard-sidebar-toggle" type="button" onClick={toggleCollapsed} aria-expanded={!collapsed} aria-label={collapsed?"Show menu names":"Show icons only"}>{collapsed?<PanelLeftOpen/>:<PanelLeftClose/>}<span>{collapsed?"Expand menu":"Collapse menu"}</span></button><button className="dashboard-sidebar-mobile-close" onClick={onClose} aria-label="Close navigation"><X/></button></div>
      <nav aria-label="Dashboard navigation">
        <a className={active==="global"?"active":undefined} href="/dashboard"><Globe2/><span>Global</span></a>
        <a className={active==="swipe"?"active":undefined} href="/discover"><GalleryHorizontalEnd/><span>Swipe</span></a>
        <Link className={active==="matches"?"active":undefined} href="/matches"><Heart/><span>Matches</span></Link>
        <Link className={active==="chats"?"active":undefined} href="/chats"><MessageCircle/><span>Chats</span></Link>
        <a className={active==="settings"?"active":undefined} href="/settings"><Settings/><span>Settings</span></a>
      </nav>
      <div className="dating-sidebar-upgrade"><Crown/><strong>Be seen first</strong><small>Stand out with Premium.</small><a href="/premium">Explore Premium</a></div>
      <a className="dating-sidebar-logout" href="/auth/logout"><LogOut/><span>Log out</span></a>
    </aside>
  </>;
}
