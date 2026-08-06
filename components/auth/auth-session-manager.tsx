"use client";
import {usePathname,useRouter} from "next/navigation";
import {useCallback,useEffect,useRef} from "react";
import type {User} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/client";

const INACTIVITY_MS=24*60*60*1000;
const ACTIVITY_THROTTLE_MS=10_000;
const STORAGE_WRITE_THROTTLE_MS=30_000;
const CHANNEL="flirtschat-auth-activity";
const key=(userId:string)=>`flirtschat:last_activity:${userId}`;

export function AuthSessionManager(){
  const router=useRouter(),pathname=usePathname(),timer=useRef<number|null>(null),user=useRef<User|null>(null),lastActivity=useRef(0),lastStored=useRef(0),loggingOut=useRef(false),broadcast=useRef<BroadcastChannel|null>(null);
  const clearTimer=useCallback(()=>{if(timer.current!==null){window.clearTimeout(timer.current);timer.current=null}},[]);
  const clearPrivateCaches=useCallback(()=>{try{localStorage.removeItem("flirtschat:offline-message-queue");sessionStorage.clear()}catch{}},[]);
  const expire=useCallback(async()=>{if(loggingOut.current||!user.current)return;loggingOut.current=true;const expiredUserId=user.current.id;clearTimer();clearPrivateCaches();try{localStorage.removeItem(key(expiredUserId))}catch{}try{await createClient().auth.signOut()}finally{user.current=null;router.replace("/login?reason=inactivity");router.refresh()}},[clearPrivateCaches,clearTimer,router]);
  const schedule=useCallback((timestamp:number)=>{clearTimer();const remaining=INACTIVITY_MS-(Date.now()-timestamp);if(remaining<=0){void expire();return}timer.current=window.setTimeout(()=>void expire(),remaining)},[clearTimer,expire]);
  const acceptActivity=useCallback((timestamp:number,store=false)=>{const current=user.current;if(!current||timestamp<=lastActivity.current)return;lastActivity.current=timestamp;schedule(timestamp);if(store||timestamp-lastStored.current>=STORAGE_WRITE_THROTTLE_MS){lastStored.current=timestamp;try{localStorage.setItem(key(current.id),String(timestamp))}catch{}broadcast.current?.postMessage({userId:current.id,timestamp})}},[schedule]);
  const activity=useCallback((force=false)=>{const now=Date.now();if(user.current&&lastActivity.current&&now-lastActivity.current>=INACTIVITY_MS){void expire();return}if(!force&&now-lastActivity.current<ACTIVITY_THROTTLE_MS)return;acceptActivity(now,force)},[acceptActivity,expire]);
  const persistCurrent=useCallback(()=>{const current=user.current;if(!current||!lastActivity.current)return;lastStored.current=lastActivity.current;try{localStorage.setItem(key(current.id),String(lastActivity.current))}catch{}broadcast.current?.postMessage({userId:current.id,timestamp:lastActivity.current})},[]);
  const start=useCallback((nextUser:User,reset=false)=>{user.current=nextUser;loggingOut.current=false;let stored=0;try{stored=Number(localStorage.getItem(key(nextUser.id))||0)}catch{}const timestamp=reset?Date.now():Number.isFinite(stored)&&stored>0?stored:Date.now();lastActivity.current=0;lastStored.current=reset?0:stored;acceptActivity(timestamp,reset||stored===0)},[acceptActivity]);

  useEffect(()=>{const supabase=createClient();if("BroadcastChannel" in window)broadcast.current=new BroadcastChannel(CHANNEL);const receive=(event:MessageEvent<{userId?:string;timestamp?:number}>)=>{if(event.data.userId===user.current?.id&&typeof event.data.timestamp==="number")acceptActivity(event.data.timestamp)};broadcast.current?.addEventListener("message",receive);const storage=(event:StorageEvent)=>{const current=user.current;if(current&&event.key===key(current.id)&&event.newValue)acceptActivity(Number(event.newValue))};window.addEventListener("storage",storage);void supabase.auth.getUser().then(({data})=>{if(data.user)start(data.user)});const{data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{if(event==="SIGNED_OUT"){user.current=null;clearTimer();return}if(session?.user&&(event==="SIGNED_IN"||user.current?.id!==session.user.id))start(session.user,event==="SIGNED_IN")});return()=>{subscription.unsubscribe();clearTimer();window.removeEventListener("storage",storage);broadcast.current?.removeEventListener("message",receive);broadcast.current?.close();broadcast.current=null}},[acceptActivity,clearTimer,start]);

  useEffect(()=>{const events:(keyof WindowEventMap)[]=["pointerdown","touchstart","keydown","scroll","mousemove","input"];const handler=()=>activity();events.forEach(name=>window.addEventListener(name,handler,{passive:true}));const visible=()=>{if(!document.hidden)activity(true);else persistCurrent()};document.addEventListener("visibilitychange",visible);window.addEventListener("pagehide",persistCurrent);return()=>{events.forEach(name=>window.removeEventListener(name,handler));document.removeEventListener("visibilitychange",visible);window.removeEventListener("pagehide",persistCurrent)}},[activity,persistCurrent]);
  useEffect(()=>{activity(true)},[activity,pathname]);
  return null;
}
