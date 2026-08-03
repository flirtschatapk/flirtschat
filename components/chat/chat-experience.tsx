"use client";

import {ArrowLeft,CheckCheck,ChevronRight,MoreHorizontal,Plus,Send,Smile} from "lucide-react";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {ProfileImage} from "@/components/profile-image";
import {loadChatMessages,saveChatMessages,type StoredChatMessage} from "@/lib/chat-storage";
import {mockFriends} from "@/lib/mock-friends";

const starter:StoredChatMessage[]=[
  {id:1,mine:false,text:"Hey there! 👋\nHow’s your day going?",time:"10:30 AM"},
  {id:2,mine:true,text:"Hey! 😊\nIt’s going great, just finished my workout. What about you?",time:"10:32 AM"},
  {id:3,mine:false,text:"Nice! 💪 I’m having a coffee and enjoying the sunshine ☀️",time:"10:34 AM"},
  {id:4,mine:true,text:"Sounds perfect! Would love to join you sometime ☕😉",time:"10:36 AM"},
  {id:5,mine:false,text:"That would be awesome! 😍\nLet’s plan it soon ❤️",time:"10:38 AM"},
];

export function ChatExperience({profileId}:{profileId:string}){
  const friend=useMemo(()=>mockFriends.find(item=>item.id===profileId)||mockFriends[0],[profileId]);
  const [messages,setMessages]=useState<StoredChatMessage[]>(starter);
  const [text,setText]=useState("");
  const [menu,setMenu]=useState(false);
  const bottomRef=useRef<HTMLDivElement>(null);
  useEffect(()=>setMessages(loadChatMessages(profileId,starter)),[profileId]);
  useEffect(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),[messages]);
  const send=()=>{const clean=text.trim();if(!clean)return;const next=[...messages,{id:Date.now(),mine:true,text:clean,time:new Date().toLocaleTimeString([],{hour:"numeric",minute:"2-digit"})}];setMessages(next);saveChatMessages(profileId,next);setText("")};
  return <main className="reference-chat-page">
    <section className="reference-chat-shell">
      <header className="reference-chat-header">
        <Link href="/chat" aria-label="Back to conversations"><ArrowLeft/></Link>
        <span className="reference-chat-avatar"><ProfileImage position={friend.position}/></span>
        <div><h1>{friend.name}<VerifiedBurst/></h1><p><i className={friend.status}/>{friend.status==="online"?"Online now":friend.lastSeen}</p></div>
        <button type="button" aria-label="Conversation options" onClick={()=>setMenu(value=>!value)}><MoreHorizontal/></button>
        {menu&&<div className="reference-chat-menu"><a href={`/profile/${friend.id}-global`}>View profile</a><button onClick={()=>setMenu(false)}>Mute conversation</button></div>}
      </header>
      <a className="reference-match-banner" href={`/profile/${friend.id}-global`}>
        <span><MatchShield/></span><div><strong>You&apos;ve both liked each other</strong><small>Start a lovely conversation 💞</small></div><ChevronRight/>
      </a>
      <div className="reference-chat-day"><span>Today</span></div>
      <div className="reference-chat-messages" aria-live="polite">
        {messages.map((message,index)=><div key={message.id}>
          {index===4&&<div className="reference-unread"><i/><span>Unread Messages</span><i/></div>}
          <article className={message.mine?"mine":"theirs"}>
            {!message.mine&&<ProfileImage position={friend.position}/>}
            <div><p>{message.text}</p><small>{message.time}{message.mine&&<CheckCheck/>}</small></div>
          </article>
        </div>)}
        <div ref={bottomRef}/>
      </div>
      <footer className="reference-chat-composer">
        <button type="button" aria-label="Add attachment"><Plus/></button>
        <label><input value={text} onChange={event=>setText(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();send()}}} placeholder="Type a message…" aria-label="Message"/><button type="button" aria-label="Choose emoji"><Smile/></button></label>
        <button type="button" className="reference-send" onClick={send} aria-label={text.trim()?"Send message":"Voice message"}>{text.trim()?<Send/>:<WaveformIcon/>}</button>
      </footer>
    </section>
  </main>;
}
function VerifiedBurst(){return <svg className="verified-burst" viewBox="0 0 32 32" aria-label="Verified profile"><path d="m16 1.8 4 3 5-.2 1.5 4.8 4.1 2.8-1.5 4.8 1.5 4.8-4.1 2.8-1.5 4.8-5-.2-4 3-4-3-5 .2-1.5-4.8-4.1-2.8L2.9 17l-1.5-4.8 4.1-2.8L7 4.6l5 .2 4-3Z" fill="#ed2ca8"/><path d="m11.2 16.2 3.1 3.2 6.8-7" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
function MatchShield(){return <svg viewBox="0 0 64 72" aria-hidden="true"><defs><linearGradient id="match-shield" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#eecaff"/></linearGradient></defs><path d="M32 3c8 7 17 9 27 10v21c0 17-10 27-27 35C15 61 5 51 5 34V13c10-1 19-3 27-10Z" fill="url(#match-shield)"/><path d="M32 48S18 40.5 18 30.8c0-5.2 6.4-8.6 10.6-4.4L32 30l3.4-3.6c4.2-4.2 10.6-.8 10.6 4.4C46 40.5 32 48 32 48Z" fill="#c625ad"/></svg>}
function WaveformIcon(){return <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 14v4M9 10v12M14 6v20M19 9v14M24 4v24M29 12v8" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/></svg>}
