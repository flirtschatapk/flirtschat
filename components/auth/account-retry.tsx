"use client";
import {LoaderCircle} from "lucide-react";
import {useEffect,useRef,useState} from "react";

export function AccountRetry(){
  const[loading,setLoading]=useState(true),[message,setMessage]=useState("Loading your account…");
  const active=useRef(true);
  const retry=async()=>{setLoading(true);setMessage("Loading your account…");const timeout=window.setTimeout(()=>{if(active.current){setLoading(false);setMessage("We're having trouble loading your account.")}},8000);try{const response=await fetch("/api/auth/destination",{method:"POST",cache:"no-store"});if(!response.ok)throw new Error("retry_failed");const{destination}=await response.json() as {destination:"/onboarding"|"/global"};if(active.current)window.location.replace(destination)}catch{if(active.current){setLoading(false);setMessage("We're having trouble loading your account.")}}finally{window.clearTimeout(timeout)}};
  useEffect(()=>{active.current=true;void retry();return()=>{active.current=false}},[]);
  return <div className="image-login-card"><div className="image-login-heading">{loading&&<LoaderCircle className="spin"/>}<h1>{message}</h1>{!loading&&<p>Your sign-in is safe. Retry loading your profile.</p>}</div>{!loading&&<button className="image-login-submit" type="button" onClick={()=>void retry()}>Retry</button>}</div>;
}
