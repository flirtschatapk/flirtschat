"use client";
import {usePresence} from "@/components/presence/presence-provider";
import {PublicProfile} from "@/components/profile/public-profile";
import type {GlobalProfile} from "@/lib/global-profiles";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {createClient} from "@/lib/supabase/client";

export function RealtimePublicProfile({profile,lastSeen}:{profile:GlobalProfile;lastSeen:string|null}){const presence=usePresence(profile.id,lastSeen),router=useRouter();useEffect(()=>{const supabase=createClient(),channel=supabase.channel("public-profile-updates",{config:{private:true}}).on("broadcast",{event:"changed"},({payload})=>{if(payload?.profile_id===profile.id)router.refresh()}).subscribe();return()=>{void supabase.removeChannel(channel)}},[profile.id,router]);return <PublicProfile profile={{...profile,online:presence.online}}/>}
