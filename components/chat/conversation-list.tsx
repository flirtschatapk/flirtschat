"use client";

import {BadgeCheck,Search,X} from "lucide-react";
import {useEffect,useMemo,useState} from "react";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {ProfileImage} from "@/components/profile-image";
import {loadChatPreviews} from "@/lib/chat-storage";
import {mockFriends} from "@/lib/mock-friends";

export function ConversationList(){
  const [query,setQuery]=useState(""),[filter,setFilter]=useState<"All"|"Unread"|"Online">("All"),[version,setVersion]=useState(0);
  useEffect(()=>{const sync=()=>setVersion(value=>value+1);window.addEventListener("storage",sync);window.addEventListener("flirtschat:chat-change",sync);return()=>{window.removeEventListener("storage",sync);window.removeEventListener("flirtschat:chat-change",sync)}},[]);
  const people=useMemo(()=>{void version;const previews=loadChatPreviews();return mockFriends.map(friend=>({...friend,lastMessage:previews[friend.id]?.text??friend.lastMessage,time:previews[friend.id]?.time??friend.time})).filter(friend=>{const match=`${friend.name} ${friend.username} ${friend.lastMessage}`.toLowerCase().includes(query.trim().toLowerCase().replace(/^@/,""));return match&&(filter==="All"||(filter==="Unread"&&friend.unread>0)||(filter==="Online"&&friend.status==="online"))})},[filter,query,version]);
  return <main className="conversation-page"><div className="conversation-shell"><header><a href="/dashboard">FLIRTSCHAT</a><span>{mockFriends.reduce((sum,item)=>sum+item.unread,0)} unread</span></header><section className="conversation-title"><span>Messages</span><h1>Your conversations</h1><p>Keep the energy going with your matches.</p></section><label className="conversation-search"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search name or @username" aria-label="Search conversations"/>{query&&<button onClick={()=>setQuery("")} aria-label="Clear search"><X/></button>}</label><div className="conversation-filters" role="tablist">{(["All","Unread","Online"] as const).map(item=><button key={item} role="tab" aria-selected={filter===item} className={filter===item?"active":""} onClick={()=>setFilter(item)}>{item}</button>)}</div><section className="conversation-list">{people.length?people.map(friend=><a href={`/chat/${friend.id}`} key={friend.id}><span className="conversation-avatar"><ProfileImage position={friend.position}/></span><div><strong>{friend.name}{friend.favorite&&<BadgeCheck/>}</strong><p>{friend.lastMessage}</p></div><time>{friend.time}</time>{friend.unread>0&&<b>{friend.unread}</b>}</a>):<div className="conversation-empty">No conversations found.</div>}</section></div><AppBottomNav active="chat"/></main>
}
