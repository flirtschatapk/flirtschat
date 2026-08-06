"use client";
import {useRouter} from "next/navigation";
import {useEffect,useState} from "react";
export const VISITED_KEY="flirtschat:has_visited";
export const WELCOME_KEY="flirtschat:welcome_seen";
export function RootVisitorGate({children}:{children:React.ReactNode}){const router=useRouter(),[ready,setReady]=useState(false);useEffect(()=>{const mobile=window.matchMedia("(max-width: 767px)").matches;let returning=false;try{returning=mobile?localStorage.getItem(WELCOME_KEY)==="true":localStorage.getItem(VISITED_KEY)==="true";if(!returning)localStorage.setItem(VISITED_KEY,"true")}catch{}if(returning){router.replace("/login");return}setReady(true)},[router]);if(!ready)return <main className="route-loading" aria-live="polite"><strong>FLIRTSCHAT</strong><span>Restoring your session…</span></main>;return children}
