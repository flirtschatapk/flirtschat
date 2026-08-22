"use client";

import {useCallback,useEffect,useState} from "react";
import {useCurrentProfile} from "@/components/profile/current-profile-provider";
import {RealtimePublicProfile} from "@/components/profile/realtime-public-profile";
import {deleteUserCache,getUserCache,setUserCache} from "@/lib/app-cache";
import type {GlobalProfile} from "@/lib/global-profiles";
import {FlirtschatLoader} from "@/components/ui/flirtschat-loader";

const PUBLIC_PROFILE_TTL=120000;
type PublicProfileCache={profile:GlobalProfile;lastSeen:string|null};

export function PublicProfileRoute({profileId}:{profileId:string}){
  const{user}=useCurrentProfile(),scope=`profile:public:${profileId}`;
  const cached=user?.id?getUserCache<PublicProfileCache>(user.id,scope,PUBLIC_PROFILE_TTL):undefined;
  const[profile,setProfile]=useState<GlobalProfile|undefined>(cached?.profile),[lastSeen,setLastSeen]=useState<string|null>(cached?.lastSeen??null),[loading,setLoading]=useState(!cached),[unavailable,setUnavailable]=useState(false);
  const load=useCallback(async()=>{
    if(!user?.id)return;
    try{
      const response=await fetch(`/api/profile/public/${encodeURIComponent(profileId)}`,{cache:"no-store",credentials:"include"});
      if(!response.ok){if(response.status===401||response.status===403||response.status===404)deleteUserCache(user.id,scope);if(response.status===401||response.status===403||response.status===404){setProfile(undefined);setUnavailable(true)}return}
      const payload=await response.json() as PublicProfileCache;
      setUserCache(user.id,scope,payload);setProfile(payload.profile);setLastSeen(payload.lastSeen);setUnavailable(false);
    }catch{if(!user?.id||!getUserCache<PublicProfileCache>(user.id,scope))setUnavailable(true)}finally{setLoading(false)}
  },[profileId,scope,user?.id]);
  useEffect(()=>{const next=user?.id?getUserCache<PublicProfileCache>(user.id,scope,PUBLIC_PROFILE_TTL):undefined;setProfile(next?.profile);setLastSeen(next?.lastSeen??null);setUnavailable(false);setLoading(!next);void load()},[load,scope,user?.id]);
  if(unavailable)return <main className="route-loading"><span>Profile unavailable.</span></main>;
  if(loading&&!profile)return <FlirtschatLoader context="profile"/>;
  if(!profile)return <main className="route-loading"><span>Profile unavailable.</span></main>;
  return <RealtimePublicProfile profile={profile} lastSeen={lastSeen} onProfileChange={()=>void load()}/>;
}
