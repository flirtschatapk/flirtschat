"use client";

import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {getConversations} from "@/lib/chat/chat-service";

type ChatUnreadContextValue={unreadChatCount:number;refreshChatUnread:()=>Promise<void>};
const ChatUnreadContext=createContext<ChatUnreadContextValue|null>(null);

export function ChatUnreadProvider({children}:{children:React.ReactNode}){
  const [unreadChatCount,setUnreadChatCount]=useState(0);
  const refreshChatUnread=useCallback(async()=>{try{const conversations=await getConversations();setUnreadChatCount(conversations.reduce((total,item)=>total+item.unread,0))}catch{setUnreadChatCount(0)}},[]);
  useEffect(()=>{const supabase=createClient();let disposed=false;let channel:ReturnType<typeof supabase.channel>|null=null;let subscription:ReturnType<typeof supabase.auth.onAuthStateChange>["data"]["subscription"]|null=null;const cleanup=()=>{if(channel){void supabase.removeChannel(channel);channel=null}};const connect=async(userId:string)=>{cleanup();if(disposed)return;await refreshChatUnread();if(disposed)return;channel=supabase.channel(`chat-unread-${userId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"fc_messages"},()=>void refreshChatUnread()).on("postgres_changes",{event:"UPDATE",schema:"public",table:"fc_conversation_members",filter:`user_id=eq.${userId}`},()=>void refreshChatUnread()).subscribe()};void supabase.auth.getUser().then(({data})=>{if(data.user)void connect(data.user.id)});subscription=supabase.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){cleanup();setUnreadChatCount(0);return}if(session?.user)void connect(session.user.id)}).data.subscription;return()=>{disposed=true;cleanup();subscription?.unsubscribe()}},[refreshChatUnread]);
  const value=useMemo(()=>({unreadChatCount,refreshChatUnread}),[refreshChatUnread,unreadChatCount]);
  return <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>;
}
export function useChatUnread(){const value=useContext(ChatUnreadContext);if(!value)throw new Error("useChatUnread must be used within ChatUnreadProvider");return value}
