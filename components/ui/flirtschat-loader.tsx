"use client";

import Image from "next/image";
import {useEffect,useState} from "react";

export const flirtschatLoadingMessages={
  chat:"Opening conversation...",
  discovery:"Finding your vibe...",
  matches:"Loading your matches...",
  profile:"Loading profile...",
  settings:"Getting things ready...",
  notifications:"Loading notifications...",
  premium:"Preparing Premium...",
  onboarding:"Getting your profile ready...",
  default:"Getting things ready...",
} as const;

type LoadingContext=keyof typeof flirtschatLoadingMessages;
type LoaderProps={message?:string;context?:LoadingContext;variant?:"page"|"inline";delayMs?:number};

export function FlirtschatLoader({message,context="default",variant="page",delayMs=180}:LoaderProps){
  const text=message??flirtschatLoadingMessages[context];
  const[visible,setVisible]=useState(variant==="inline"||delayMs<=0);
  useEffect(()=>{
    if(variant==="inline"||delayMs<=0){setVisible(true);return}
    const timer=window.setTimeout(()=>setVisible(true),delayMs);
    return()=>window.clearTimeout(timer);
  },[delayMs,variant]);
  if(variant==="inline")return <span className="fc-action-loader" role="status" aria-label={text}><i/><i/><i/></span>;
  if(!visible)return <main className="fc-branded-loader fc-branded-loader-delay" aria-hidden="true"/>;
  return <main className="fc-branded-loader" role="status" aria-live="polite" aria-label={text}>
    <div className="fc-loader-content">
      <div className="fc-loader-orbit" aria-hidden="true">
        <span className="fc-loader-ring ring-one"/><span className="fc-loader-ring ring-two"/>
        <span className="fc-loader-particle particle-one"/><span className="fc-loader-particle particle-two"/><span className="fc-loader-particle particle-three"/>
        <div className="fc-loader-icon"><Image src="/images/flirtschat-icon-512.png" alt="" width={104} height={104} priority/></div>
      </div>
      <strong className="fc-loader-wordmark">FLIRTSCHAT</strong>
      <span className="fc-loader-message">{text}</span>
      <span className="fc-loader-dots" aria-hidden="true"><i/><i/><i/><i/></span>
    </div>
  </main>;
}

export function FlirtschatActionLoader({label="Loading..."}:{label?:string}){
  return <span className="fc-inline-loading" role="status"><FlirtschatLoader variant="inline" message={label}/><span>{label}</span></span>;
}
