"use client";

import type {RealtimeChannel} from "@supabase/supabase-js";
import {createClient} from "@/lib/supabase/client";

type PublicProfileListener=(profileId:string|null)=>void;

const listeners=new Set<PublicProfileListener>();
let channel:RealtimeChannel|null=null;
let cleanupTimer:ReturnType<typeof setTimeout>|null=null;

function ensureChannel(){
  if(cleanupTimer){clearTimeout(cleanupTimer);cleanupTimer=null}
  if(channel)return;
  const supabase=createClient();
  channel=supabase.channel("public-profile-updates")
    .on("broadcast",{event:"changed"},({payload})=>{
      const profileId=payload&&typeof payload.profile_id==="string"?payload.profile_id:null;
      listeners.forEach(listener=>listener(profileId));
    })
    .subscribe();
}

export function subscribeToPublicProfileUpdates(listener:PublicProfileListener){
  listeners.add(listener);
  ensureChannel();
  return()=>{
    listeners.delete(listener);
    if(listeners.size||cleanupTimer)return;
    cleanupTimer=setTimeout(()=>{
      cleanupTimer=null;
      if(listeners.size||!channel)return;
      const staleChannel=channel;
      channel=null;
      void createClient().removeChannel(staleChannel);
    },0);
  };
}
