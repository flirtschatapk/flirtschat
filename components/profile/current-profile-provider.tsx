"use client";

import type {User} from "@supabase/supabase-js";
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from "react";
import {getCurrentProfile,ProfileRequestError} from "@/lib/profile-service";
import type {CurrentProfile} from "@/lib/profile-types";
import {createClient} from "@/lib/supabase/client";
import {clearUserCache,getUserCache,setUserCache} from "@/lib/app-cache";

type CurrentProfileContextValue={
  user:User|null;
  profile:CurrentProfile|null;
  loading:boolean;
  error:string|null;
  unauthorized:boolean;
  authStatus:AuthStatus;
  refresh:()=>Promise<CurrentProfile|null>;
  setCurrentProfile:(profile:CurrentProfile)=>void;
};
type AuthStatus="loading"|"authenticated"|"unauthenticated";

const CurrentProfileContext=createContext<CurrentProfileContextValue|null>(null);
const PROFILE_CACHE_TTL=300000;

export function CurrentProfileProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<User|null>(null),[profile,setProfile]=useState<CurrentProfile|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[unauthorized,setUnauthorized]=useState(false),[authStatus,setAuthStatus]=useState<AuthStatus>("loading");
  const mounted=useRef(true);
  const authRestored=useRef(false);
  const currentUserRef=useRef<User|null>(null),previousUserId=useRef<string|null>(null);
  const refresh=useCallback(async()=>{
    const requestedUserId=currentUserRef.current?.id;
    const cached=requestedUserId?getUserCache<CurrentProfile>(requestedUserId,"profile:me",PROFILE_CACHE_TTL):undefined;
    if(cached&&mounted.current){setProfile(cached);setUnauthorized(false);setError(null);setLoading(false)}
    setError(null);
    try{
      const value=await getCurrentProfile();
      if(process.env.NODE_ENV==="development")console.info("[AuthTrace] profile status",{status:"loaded"});
      if(mounted.current&&currentUserRef.current?.id===requestedUserId){setProfile(value);setUnauthorized(false);if(value)setUserCache(value.id,"profile:me",value)}
      return value;
    }catch(reason){
      const signedOut=reason instanceof ProfileRequestError&&reason.status===401;
      if(process.env.NODE_ENV==="development")console.info("[AuthTrace] profile status",{status:signedOut?401:"error"});
      if(signedOut&&requestedUserId)clearUserCache(requestedUserId);
      if(mounted.current&&currentUserRef.current?.id===requestedUserId){if(signedOut)setProfile(null);setUnauthorized(false);setError(signedOut?"We couldn't confirm your profile session.":cached?null:"We couldn't load your profile.")}
      return null;
    }finally{if(mounted.current&&currentUserRef.current?.id===requestedUserId)setLoading(false)}
  },[]);
  const setCurrentProfile=useCallback((next:CurrentProfile)=>{setProfile(next);setUserCache(next.id,"profile:me",next)},[]);

  useEffect(()=>{
    mounted.current=true;
    const supabase=createClient();
    const trace=(message:string,details?:Record<string,unknown>)=>{if(process.env.NODE_ENV==="development")console.info(`[AuthTrace] ${message}`,details??{})};
    void supabase.auth.getUser().then(({data,error:authError})=>{
      if(!mounted.current)return;
      trace("auth state",{source:"getUser",hasUser:Boolean(data.user),error:authError?.code??null});
      trace("current user",{hasUser:Boolean(data.user)});
      if(authError)return;
      if(data.user){if(previousUserId.current&&previousUserId.current!==data.user.id){clearUserCache(previousUserId.current);setProfile(null);setLoading(true)}currentUserRef.current=data.user;previousUserId.current=data.user.id;setUser(data.user);setAuthStatus("authenticated");void refresh()}
      else if(authRestored.current){void supabase.auth.getSession().then(({data:{session},error:sessionError})=>{if(!mounted.current)return;trace("current session",{hasSession:Boolean(session),error:sessionError?.code??null});if(session?.user){currentUserRef.current=session.user;previousUserId.current=session.user.id;setUser(session.user);setAuthStatus("authenticated");void refresh()}else{trace("redirect to login reason",{reason:"confirmed_unauthenticated"});setAuthStatus("unauthenticated");setUnauthorized(true);setLoading(false)}})}
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((event,nextSession)=>{
      trace("auth state",{source:"onAuthStateChange",event,hasSession:Boolean(nextSession)});
      trace("current session",{hasSession:Boolean(nextSession)});
      if(event==="INITIAL_SESSION")authRestored.current=true;
      if(event==="SIGNED_OUT"){
        clearUserCache();
        currentUserRef.current=null;
        previousUserId.current=null;
        trace("SIGNED_OUT event");
        trace("redirect to login reason",{reason:"confirmed_signed_out"});
        setAuthStatus("unauthenticated");setUser(null);setProfile(null);setUnauthorized(true);setLoading(false);return;
      }
      const nextUser=nextSession?.user??null;
      if(!nextUser)return;
      if(previousUserId.current&&previousUserId.current!==nextUser.id){clearUserCache(previousUserId.current);setProfile(null);setLoading(true)}
      currentUserRef.current=nextUser;
      previousUserId.current=nextUser.id;
      setAuthStatus("authenticated");setUser(nextUser);setUnauthorized(false);
      if(event==="SIGNED_IN"||event==="INITIAL_SESSION"){setLoading(true);void refresh()}
    });
    return()=>{mounted.current=false;subscription.unsubscribe()};
  },[refresh]);

  useEffect(()=>{
    if(!user)return;
    const supabase=createClient();
    const channel=supabase.channel(`current-profile-${user.id}`)
      .on("postgres_changes",{event:"*",schema:"public",table:"fc_profiles",filter:`id=eq.${user.id}`},()=>void refresh())
      .on("postgres_changes",{event:"*",schema:"public",table:"fc_profile_photos",filter:`user_id=eq.${user.id}`},()=>void refresh())
      .subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[refresh,user]);

  const value=useMemo(()=>({user,profile,loading,error,unauthorized,authStatus,refresh,setCurrentProfile}),[user,profile,loading,error,unauthorized,authStatus,refresh,setCurrentProfile]);
  return <CurrentProfileContext.Provider value={value}>{children}</CurrentProfileContext.Provider>;
}

export function useCurrentProfile(){
  const value=useContext(CurrentProfileContext);
  if(!value)throw new Error("useCurrentProfile must be used inside CurrentProfileProvider");
  return value;
}
