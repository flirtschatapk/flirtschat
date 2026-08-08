"use client";

import type {AuthChangeEvent,Session,User} from "@supabase/supabase-js";
import {usePathname,useRouter} from "next/navigation";
import {useCallback,useEffect,useRef} from "react";
import {createClient} from "@/lib/supabase/client";

const INACTIVITY_LIMIT_MS=24*60*60*1000;
const ACTIVITY_THROTTLE_MS=10_000;
const STORAGE_WRITE_THROTTLE_MS=30_000;
const CHANNEL="flirtschat-auth-activity";
const key=(userId:string)=>`flirtschat:last_activity:${userId}`;
const debug=(message:string,details?:Record<string,unknown>)=>{
  if(process.env.NODE_ENV==="development")console.info("[AuthTrace]",message,details??{});
};

export function AuthSessionManager(){
  const router=useRouter();
  const pathname=usePathname();
  const timer=useRef<number|null>(null);
  const user=useRef<User|null>(null);
  const lastActivity=useRef(0);
  const lastStored=useRef(0);
  const loggingOut=useRef(false);
  const broadcast=useRef<BroadcastChannel|null>(null);
  const evaluateTimer=useRef<()=>void>(()=>undefined);

  const clearTimer=useCallback(()=>{
    if(timer.current!==null){
      window.clearTimeout(timer.current);
      timer.current=null;
    }
  },[]);

  const clearPrivateCaches=useCallback(()=>{
    try{
      localStorage.removeItem("flirtschat:offline-message-queue");
      sessionStorage.clear();
    }catch{}
  },[]);

  const automaticLogout=useCallback(async(reason:"24h_inactivity")=>{
    if(loggingOut.current||!user.current)return;
    loggingOut.current=true;
    const expiredUserId=user.current.id;
    debug("signOut reason",{reason});
    clearTimer();
    clearPrivateCaches();
    try{localStorage.removeItem(key(expiredUserId))}catch{}
    try{await createClient().auth.signOut()}
    finally{
      user.current=null;
      router.replace("/login?reason=inactivity");
      router.refresh();
    }
  },[clearPrivateCaches,clearTimer,router]);

  const schedule=useCallback((timestamp:number)=>{
    clearTimer();
    const remaining=Math.max(0,INACTIVITY_LIMIT_MS-(Date.now()-timestamp));
    debug("timer reset",{remainingMs:remaining});
    timer.current=window.setTimeout(()=>evaluateTimer.current(),remaining);
  },[clearTimer]);

  const evaluate=useCallback(()=>{
    timer.current=null;
    const current=user.current;
    if(!current)return;
    let latest=lastActivity.current;
    try{
      const stored=Number(localStorage.getItem(key(current.id))||0);
      if(Number.isFinite(stored))latest=Math.max(latest,stored);
    }catch{}
    lastActivity.current=latest;
    const elapsed=Date.now()-latest;
    debug("timer fired",{elapsedMs:elapsed});
    if(elapsed>=INACTIVITY_LIMIT_MS){
      void automaticLogout("24h_inactivity");
      return;
    }
    schedule(latest);
  },[automaticLogout,schedule]);
  evaluateTimer.current=evaluate;

  const acceptActivity=useCallback((timestamp:number,store=false)=>{
    const current=user.current;
    if(!current||!Number.isFinite(timestamp)||timestamp<=lastActivity.current)return;
    lastActivity.current=timestamp;
    debug("activity");
    schedule(timestamp);
    if(store||timestamp-lastStored.current>=STORAGE_WRITE_THROTTLE_MS){
      lastStored.current=timestamp;
      try{localStorage.setItem(key(current.id),String(timestamp))}catch{}
      broadcast.current?.postMessage({userId:current.id,timestamp});
    }
  },[schedule]);

  const activity=useCallback((force=false)=>{
    const now=Date.now();
    if(!user.current)return;
    if(lastActivity.current&&now-lastActivity.current>=INACTIVITY_LIMIT_MS){
      evaluateTimer.current();
      return;
    }
    if(!force&&now-lastActivity.current<ACTIVITY_THROTTLE_MS)return;
    acceptActivity(now,force);
  },[acceptActivity]);

  const persistCurrent=useCallback(()=>{
    const current=user.current;
    if(!current||!lastActivity.current)return;
    lastStored.current=lastActivity.current;
    try{localStorage.setItem(key(current.id),String(lastActivity.current))}catch{}
    broadcast.current?.postMessage({userId:current.id,timestamp:lastActivity.current});
  },[]);

  const start=useCallback((nextUser:User,freshSignIn=false)=>{
    user.current=nextUser;
    loggingOut.current=false;
    let stored=0;
    try{stored=Number(localStorage.getItem(key(nextUser.id))||0)}catch{}
    const timestamp=freshSignIn?Date.now():Number.isFinite(stored)&&stored>0?stored:Date.now();
    lastActivity.current=0;
    lastStored.current=freshSignIn?0:stored;
    acceptActivity(timestamp,freshSignIn||stored===0);
  },[acceptActivity]);

  useEffect(()=>{
    const popstate=()=>debug("browser popstate",{pathname:window.location.pathname});
    window.addEventListener("popstate",popstate);
    return()=>window.removeEventListener("popstate",popstate);
  },[]);

  useEffect(()=>{
    debug("route change",{pathname});
    activity(true);
  },[activity,pathname]);

  useEffect(()=>{
    const supabase=createClient();
    if("BroadcastChannel" in window)broadcast.current=new BroadcastChannel(CHANNEL);
    const receive=(event:MessageEvent<{userId?:string;timestamp?:number}>)=>{
      if(event.data.userId===user.current?.id&&typeof event.data.timestamp==="number")acceptActivity(event.data.timestamp);
    };
    const storage=(event:StorageEvent)=>{
      const current=user.current;
      if(current&&event.key===key(current.id)&&event.newValue)acceptActivity(Number(event.newValue));
    };
    const handleAuthChange=(event:AuthChangeEvent,nextSession:Session|null)=>{
      if(event==="SIGNED_OUT"){
        user.current=null;
        loggingOut.current=false;
        clearTimer();
        return;
      }
      if(event==="TOKEN_REFRESHED"||event==="USER_UPDATED")return;
      if(nextSession?.user&&(event==="SIGNED_IN"||event==="INITIAL_SESSION"||user.current?.id!==nextSession.user.id)){
        start(nextSession.user,event==="SIGNED_IN");
      }
    };
    broadcast.current?.addEventListener("message",receive);
    window.addEventListener("storage",storage);
    void supabase.auth.getUser().then(({data})=>{
      if(data.user&&user.current?.id!==data.user.id)start(data.user);
    });
    const{data:{subscription}}=supabase.auth.onAuthStateChange(handleAuthChange);
    return()=>{
      subscription.unsubscribe();
      clearTimer();
      window.removeEventListener("storage",storage);
      broadcast.current?.removeEventListener("message",receive);
      broadcast.current?.close();
      broadcast.current=null;
    };
  },[acceptActivity,clearTimer,start]);

  useEffect(()=>{
    const events:(keyof WindowEventMap)[]=["pointerdown","touchstart","keydown","input","scroll","mousemove"];
    const handler=()=>activity();
    events.forEach(name=>window.addEventListener(name,handler,{passive:true}));
    const visible=()=>{
      if(!document.hidden)activity(true);
      else persistCurrent();
    };
    document.addEventListener("visibilitychange",visible);
    window.addEventListener("pagehide",persistCurrent);
    return()=>{
      events.forEach(name=>window.removeEventListener(name,handler));
      document.removeEventListener("visibilitychange",visible);
      window.removeEventListener("pagehide",persistCurrent);
    };
  },[activity,persistCurrent]);

  return null;
}
