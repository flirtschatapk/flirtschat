"use client";
import {useRouter} from "next/navigation";
import {useEffect,useState} from "react";
import {FlirtschatLoader} from "@/components/ui/flirtschat-loader";
export const VISITED_KEY="flirtschat:has_visited";
export const WELCOME_KEY="flirtschat:welcome_seen";
export function RootVisitorGate({children}:{children:React.ReactNode}){const router=useRouter(),[ready,setReady]=useState(false);useEffect(()=>{const mobile=window.matchMedia("(max-width: 767px)").matches;let returning=false;try{returning=mobile?localStorage.getItem(WELCOME_KEY)==="true":localStorage.getItem(VISITED_KEY)==="true";if(!returning)localStorage.setItem(VISITED_KEY,"true")}catch{}if(returning){router.replace("/login");return}setReady(true)},[router]);if(!ready)return <FlirtschatLoader message="Restoring your session..."/>;return children}
