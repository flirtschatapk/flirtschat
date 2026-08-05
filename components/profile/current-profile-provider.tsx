"use client";

import type {User} from "@supabase/supabase-js";
import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState} from "react";
import {getCurrentProfile,ProfileRequestError} from "@/lib/profile-service";
import type {CurrentProfile} from "@/lib/profile-types";
import {createClient} from "@/lib/supabase/client";

type CurrentProfileContextValue={
  user:User|null;
  profile:CurrentProfile|null;
  loading:boolean;
  error:string|null;
  unauthorized:boolean;
  refresh:()=>Promise<CurrentProfile|null>;
};

const CurrentProfileContext=createContext<CurrentProfileContextValue|null>(null);

export function CurrentProfileProvider({children}:{children:React.ReactNode}){
  const [user,setUser]=useState<User|null>(null),[profile,setProfile]=useState<CurrentProfile|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[unauthorized,setUnauthorized]=useState(false);
  const mounted=useRef(true);
  const refresh=useCallback(async()=>{
    setError(null);
    try{
      const value=await getCurrentProfile();
      if(mounted.current){setProfile(value);setUnauthorized(false)}
      return value;
    }catch(reason){
      const signedOut=reason instanceof ProfileRequestError&&reason.status===401;
      if(mounted.current){setProfile(null);setUnauthorized(signedOut);setError(signedOut?null:"We couldn't load your profile.")}
      return null;
    }finally{if(mounted.current)setLoading(false)}
  },[]);

  useEffect(()=>{
    mounted.current=true;
    const supabase=createClient();
    void supabase.auth.getUser().then(({data})=>{
      if(!mounted.current)return;
      setUser(data.user);
      if(data.user)void refresh();else{setUnauthorized(true);setLoading(false)}
    });
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,nextSession)=>{
      const nextUser=nextSession?.user??null;
      setUser(nextUser);
      if(nextUser){setLoading(true);void refresh()}else{setProfile(null);setUnauthorized(true);setLoading(false)}
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

  const value=useMemo(()=>({user,profile,loading,error,unauthorized,refresh}),[user,profile,loading,error,unauthorized,refresh]);
  return <CurrentProfileContext.Provider value={value}>{children}</CurrentProfileContext.Provider>;
}

export function useCurrentProfile(){
  const value=useContext(CurrentProfileContext);
  if(!value)throw new Error("useCurrentProfile must be used inside CurrentProfileProvider");
  return value;
}
