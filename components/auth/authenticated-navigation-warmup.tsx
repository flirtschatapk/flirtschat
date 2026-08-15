"use client";

import {useRouter} from "next/navigation";
import {useEffect} from "react";
import {useCurrentProfile} from "@/components/profile/current-profile-provider";

const routes=["/discover","/chats","/matches","/settings","/notifications","/profile"];

export function AuthenticatedNavigationWarmup(){
  const router=useRouter(),{authStatus}=useCurrentProfile();
  useEffect(()=>{
    if(authStatus!=="authenticated")return;
    const id=window.requestIdleCallback?window.requestIdleCallback(()=>routes.forEach(route=>router.prefetch(route))):window.setTimeout(()=>routes.forEach(route=>router.prefetch(route)),300);
    return()=>{if(typeof id==="number"&&window.cancelIdleCallback)window.cancelIdleCallback(id);else window.clearTimeout(id)};
  },[authStatus,router]);
  return null;
}
