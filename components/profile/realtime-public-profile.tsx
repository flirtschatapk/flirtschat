"use client";
import {usePresence} from "@/components/presence/presence-provider";
import {PublicProfile} from "@/components/profile/public-profile";
import type {GlobalProfile} from "@/lib/global-profiles";
import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {subscribeToPublicProfileUpdates} from "@/lib/public-profile-realtime";

export function RealtimePublicProfile({profile,lastSeen,onProfileChange}:{profile:GlobalProfile;lastSeen:string|null;onProfileChange?:()=>void}){const presence=usePresence(profile.id,lastSeen),router=useRouter();useEffect(()=>subscribeToPublicProfileUpdates(profileId=>{if(profileId!==profile.id)return;if(onProfileChange){onProfileChange();return}router.refresh()}),[onProfileChange,profile.id,router]);return <PublicProfile profile={{...profile,online:presence.online}}/>}
