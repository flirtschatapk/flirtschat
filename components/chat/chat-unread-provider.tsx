"use client";

import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {getUnreadChatCount} from "@/lib/chat/chat-service";

type ChatUnreadContextValue={unreadChatCount:number;refreshChatUnread:()=>Promise<void>};
const ChatUnreadContext=createContext<ChatUnreadContextValue|null>(null);

export function ChatUnreadProvider({children}:{children:React.ReactNode}){
  const [unreadChatCount,setUnreadChatCount]=useState(0);
  const refreshChatUnread=useCallback(async()=>{try{setUnreadChatCount(await getUnreadChatCount())}catch{setUnreadChatCount(0)}},[]);
  useEffect(()=>{
    const supabase=createClient();
    let disposed=false;
    let channel:ReturnType<typeof supabase.channel>|null=null;
    let connectedUserId:string|null=null;
    let connectingUserId:string|null=null;
    let generation=0;
    let lifecycle=Promise.resolve();
    let subscription:ReturnType<typeof supabase.auth.onAuthStateChange>["data"]["subscription"]|null=null;
    const enqueue=(task:()=>Promise<void>)=>{const next=lifecycle.then(task,task);lifecycle=next.catch(()=>undefined);return next};
    const disconnect=()=>{
      generation+=1;
      connectedUserId=null;
      connectingUserId=null;
      const oldChannel=channel;
      channel=null;
      return enqueue(async()=>{if(oldChannel)await supabase.removeChannel(oldChannel)});
    };
    const connect=(userId:string)=>{
      if(disposed||connectedUserId===userId||connectingUserId===userId)return;
      const myGeneration=++generation;
      connectingUserId=userId;
      void enqueue(async()=>{
        if(disposed||myGeneration!==generation)return;
        const oldChannel=channel;
        channel=null;
        connectedUserId=null;
        if(oldChannel)await supabase.removeChannel(oldChannel);
        if(disposed||myGeneration!==generation)return;
        await refreshChatUnread();
        if(disposed||myGeneration!==generation)return;
        const nextChannel=supabase.channel(`chat-unread-${userId}-${myGeneration}`)
          .on("postgres_changes",{event:"INSERT",schema:"public",table:"fc_messages"},()=>void refreshChatUnread())
          .on("postgres_changes",{event:"UPDATE",schema:"public",table:"fc_conversation_members",filter:`user_id=eq.${userId}`},()=>void refreshChatUnread());
        if(disposed||myGeneration!==generation){await supabase.removeChannel(nextChannel);return}
        channel=nextChannel;
        connectedUserId=userId;
        connectingUserId=null;
        try{nextChannel.subscribe()}catch{if(channel===nextChannel)channel=null;connectedUserId=null;await supabase.removeChannel(nextChannel)}
      });
    };
    const handleAuth=({event,userId}:{event:string;userId?:string})=>{
      if(event==="SIGNED_OUT"){
        void disconnect();
        setUnreadChatCount(0);
        return;
      }
      if(userId)connect(userId);
    };
    void supabase.auth.getUser().then(({data})=>{if(!disposed&&data.user)connect(data.user.id)}).catch(()=>undefined);
    subscription=supabase.auth.onAuthStateChange((event,session)=>handleAuth({event,userId:session?.user?.id})).data.subscription;
    return()=>{
      disposed=true;
      void disconnect();
      subscription?.unsubscribe();
    };
  },[refreshChatUnread]);
  const value=useMemo(()=>({unreadChatCount,refreshChatUnread}),[refreshChatUnread,unreadChatCount]);
  return <ChatUnreadContext.Provider value={value}>{children}</ChatUnreadContext.Provider>;
}
export function useChatUnread(){const value=useContext(ChatUnreadContext);if(!value)throw new Error("useChatUnread must be used within ChatUnreadProvider");return value}
