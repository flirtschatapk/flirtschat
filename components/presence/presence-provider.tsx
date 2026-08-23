"use client";

import type {AuthChangeEvent,RealtimeChannel,User} from "@supabase/supabase-js";
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";

type PresenceValue={online:boolean;lastSeen:string|null};
type WatchedChannel={references:number;graceTimer:number|null;lastHeartbeat:string|null};
type PresenceContextValue={currentUserId:string|null;statuses:Record<string,PresenceValue>;now:number;watch:(userId:string)=>()=>void};

const PresenceContext=createContext<PresenceContextValue|null>(null);
const HEARTBEAT_MS=30_000;
const OFFLINE_GRACE_MS=90_000;
const topic="presence:global";
const payload=(user:User)=>({user_id:user.id,last_seen:new Date().toISOString(),connected_at:new Date().toISOString(),platform:typeof navigator==="undefined"?"web":/Android|iPhone|iPad/i.test(navigator.userAgent)?"mobile-web":"desktop-web",page:typeof location==="undefined"?"/":location.pathname});

export function PresenceProvider({children}:{children:React.ReactNode}){
  const supabase=useMemo(()=>createClient(),[]);
  const ownChannel=useRef<RealtimeChannel|null>(null);
  const watched=useRef(new Map<string,WatchedChannel>());
  const onlineUserIds=useRef(new Set<string>());
  const heartbeat=useRef<number|null>(null);
  const userRef=useRef<User|null>(null);
  const[currentUserId,setCurrentUserId]=useState<string|null>(null);
  const[statuses,setStatuses]=useState<Record<string,PresenceValue>>({});
  const[now,setNow]=useState(()=>Date.now());

  const setStatus=useCallback((userId:string,value:PresenceValue)=>{
    if(value.online)onlineUserIds.current.add(userId);else onlineUserIds.current.delete(userId);
    setStatuses(current=>{
      const previous=current[userId];
      return previous?.online===value.online&&previous?.lastSeen===value.lastSeen?current:{...current,[userId]:value};
    });
  },[]);

  const persistLastSeen=useCallback(()=>{
    void fetch("/api/presence/heartbeat",{method:"POST",cache:"no-store",keepalive:true}).catch(()=>undefined);
  },[]);

  const stopHeartbeat=useCallback(()=>{
    if(heartbeat.current!==null){window.clearInterval(heartbeat.current);heartbeat.current=null}
  },[]);

  const beat=useCallback(()=>{
    const user=userRef.current,channel=ownChannel.current;
    if(user&&channel)void channel.track(payload(user));
    setNow(Date.now());
  },[]);

  const startHeartbeat=useCallback(()=>{
    stopHeartbeat();
    beat();
    heartbeat.current=window.setInterval(beat,HEARTBEAT_MS);
  },[beat,stopHeartbeat]);

  const clearGrace=useCallback((item:WatchedChannel)=>{
    if(item.graceTimer!==null){window.clearTimeout(item.graceTimer);item.graceTimer=null}
  },[]);

  const markOffline=useCallback((userId:string,item:WatchedChannel)=>{
    clearGrace(item);
    setStatus(userId,{online:false,lastSeen:item.lastHeartbeat});
  },[clearGrace,setStatus]);

  const scheduleOffline=useCallback((userId:string,item:WatchedChannel)=>{
    if(!onlineUserIds.current.has(userId)){markOffline(userId,item);return}
    if(item.graceTimer!==null)return;
    item.graceTimer=window.setTimeout(()=>{
      item.graceTimer=null;
      const entries=ownChannel.current?.presenceState()[userId]??[];
      if(entries.length)return;
      setStatus(userId,{online:false,lastSeen:item.lastHeartbeat});
    },OFFLINE_GRACE_MS);
  },[markOffline,setStatus]);

  const syncWatched=useCallback(()=>{
    const channel=ownChannel.current;
    if(!channel)return;
    const state=channel.presenceState();
    watched.current.forEach((item,userId)=>{
      const entries=(state[userId]??[])as Array<{last_seen?:unknown}>;
      const latest=entries.map(entry=>typeof entry.last_seen==="string"?entry.last_seen:null).find(Boolean)??null;
      if(entries.length){
        clearGrace(item);
        item.lastHeartbeat=latest;
        setStatus(userId,{online:true,lastSeen:null});
      }else scheduleOffline(userId,item);
    });
  },[clearGrace,scheduleOffline,setStatus]);

  const leave=useCallback((sessionEnded=false)=>{
    stopHeartbeat();
    const channel=ownChannel.current,user=userRef.current;
    if(sessionEnded&&user){
      persistLastSeen();
      if(channel)void channel.send({type:"broadcast",event:"session-ended",payload:{user_id:user.id}});
    }
    if(channel){void channel.untrack();void supabase.removeChannel(channel);ownChannel.current=null}
    if(user)setStatus(user.id,{online:false,lastSeen:sessionEnded?new Date().toISOString():null});
  },[persistLastSeen,setStatus,stopHeartbeat,supabase]);

  const join=useCallback((user:User)=>{
    leave(false);
    userRef.current=user;
    setCurrentUserId(user.id);
    const channel=supabase.channel(topic,{config:{presence:{key:user.id}}});
    ownChannel.current=channel;
    channel.on("presence",{event:"sync"},syncWatched)
      .on("presence",{event:"join"},syncWatched)
      .on("presence",{event:"leave"},syncWatched)
      .on("broadcast",{event:"session-ended"},({payload:message})=>{
        if(message?.user_id){const item=watched.current.get(message.user_id);if(item)markOffline(message.user_id,item)}
      }).subscribe(status=>{
      if(status==="SUBSCRIBED")startHeartbeat();
    });
  },[leave,markOffline,startHeartbeat,supabase,syncWatched]);

  useEffect(()=>{
    const watchedChannels=watched.current;
    void supabase.auth.getUser().then(({data})=>{if(data.user)join(data.user)});
    const{data:{subscription}}=supabase.auth.onAuthStateChange((event:AuthChangeEvent,session)=>{
      if(session?.user){if(userRef.current?.id!==session.user.id)join(session.user);return}
      if(event==="SIGNED_OUT")leave(true);else leave(false);
      userRef.current=null;
      setCurrentUserId(null);
    });
    return()=>{
      subscription.unsubscribe();
      leave(false);
      for(const item of watchedChannels.values()){
        clearGrace(item);
      }
      watchedChannels.clear();
    };
  },[clearGrace,join,leave,supabase]);

  const watch=useCallback((userId:string)=>{
    if(!userId||userId===userRef.current?.id)return()=>undefined;
    const existing=watched.current.get(userId);
    if(existing){
      existing.references++;
      return()=>{
        existing.references=Math.max(0,existing.references-1);
        if(existing.references===0){clearGrace(existing);watched.current.delete(userId);setStatus(userId,{online:false,lastSeen:null})}
      };
    }
    const item:WatchedChannel={references:1,graceTimer:null,lastHeartbeat:null};
    watched.current.set(userId,item);
    syncWatched();
    return()=>{
      item.references=Math.max(0,item.references-1);
      if(item.references===0){clearGrace(item);watched.current.delete(userId);setStatus(userId,{online:false,lastSeen:null})}
    };
  },[clearGrace,setStatus,syncWatched]);

  const value=useMemo(()=>({currentUserId,statuses,now,watch}),[currentUserId,statuses,now,watch]);
  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function usePresence(userId:string|null|undefined,lastSeen:string|null=null){const context=useContext(PresenceContext);if(!context)throw new Error("usePresence must be used inside PresenceProvider");const{watch,statuses,now}=context;useEffect(()=>userId?watch(userId):undefined,[watch,userId]);const status=userId?statuses[userId]:undefined;return{online:Boolean(status?.online),lastSeen:status?.lastSeen??lastSeen,label:status?.online?"Online now":formatLastSeen(status?.lastSeen??lastSeen,now)}}
export function formatLastSeen(value:string|null|undefined,now=Date.now()){if(!value)return"Offline";const time=new Date(value).getTime();if(!Number.isFinite(time))return"Offline";const minutes=Math.max(0,Math.floor((now-time)/60000));if(minutes<1)return"Last seen just now";if(minutes<60)return`Last seen ${minutes} minute${minutes===1?"":"s"} ago`;const hours=Math.floor(minutes/60);if(hours<24)return`Last seen ${hours} hour${hours===1?"":"s"} ago`;if(hours<48)return"Last seen yesterday";return`Last seen ${new Date(time).toLocaleDateString()}`}
