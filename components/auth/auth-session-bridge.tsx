"use client";
import {useEffect} from "react";
import {createClient} from "@/lib/supabase/client";
import {establishMockSession} from "@/lib/mock-auth-guard";

export function AuthSessionBridge({next}:{next:string}){
  useEffect(()=>{
    let active=true;
    createClient().auth.getUser().then(({data,error})=>{
      if(!active)return;
      if(error||!data.user){window.location.replace("/login?error=session");return}
      establishMockSession(true);
      window.location.replace(next);
    });
    return()=>{active=false};
  },[next]);
  return <main className="route-loading" role="status">Completing secure sign in…</main>;
}
