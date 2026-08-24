import {Globe2,Heart,LogOut,MessageCircle,Settings,UsersRound} from "lucide-react";
import Link from "next/link";
import {AppBottomNav} from "@/components/app-bottom-nav";

export function DiscoverNavigation(){return <><aside className="discover-desktop-sidebar"><a className="discover-sidebar-brand" href="/discover">FLIRTSCHAT</a><nav aria-label="Main navigation"><a href="/global"><Globe2/>Global</a><a className="active" href="/discover"><UsersRound/>Connect</a><Link href="/matches"><Heart/>Matches</Link><Link href="/chats"><MessageCircle/>Chats</Link><a href="/settings"><Settings/>Settings</a></nav><div><a href="/login"><LogOut/>Log out</a></div></aside><AppBottomNav active="connect"/></>}
