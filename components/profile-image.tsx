"use client";
/* eslint-disable @next/next/no-img-element -- remote profile hosts are user data and cannot be safely enumerated in next.config */

import Image from "next/image";
import {UserRound} from "lucide-react";
import {useEffect,useState} from "react";

type ProfileImageProps={position?:string;className?:string;alt?:string;src?:string|null;priority?:boolean};
const profilePhotoUrlCache=new Map<string,string>();
function safeSource(value:string|null|undefined){if(!value)return null;const source=value.trim();return source.startsWith("/")||source.startsWith("https://")?source:null}
function cachedSource(value:string|null){if(!value)return null;const cached=profilePhotoUrlCache.get(value);if(cached)return cached;profilePhotoUrlCache.set(value,value);return value}

export function ProfileImage({position="0% 0%",className="",alt="Flirtschat member",src=null,priority=false}:ProfileImageProps){
  const positionUrl=safeSource(position),requested=cachedSource(positionUrl??safeSource(src)),[failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[requested]);
  useEffect(()=>{if(process.env.NODE_ENV==="development"&&requested)console.debug("[PhotoPerf] image-load-start",{src:requested})},[requested]);
  const isSprite=requested==="/images/profiles.png",isRemote=Boolean(requested?.startsWith("https://")),effectivePosition=positionUrl?"50% 50%":position;
  const loaded=()=>{if(process.env.NODE_ENV==="development"&&requested)console.debug("[PhotoPerf] image-load-done",{src:requested})};
  return <span className={`profile-image ${isSprite?"profile-image--sprite":"profile-image--asset"} ${className}`.trim()}>{requested&&!failed?(isRemote?<img src={requested} alt={alt} loading={priority?"eager":"lazy"} fetchPriority={priority?"high":"auto"} decoding="async" referrerPolicy="no-referrer" style={{objectPosition:effectivePosition,objectFit:"cover"}} onLoad={loaded} onError={()=>setFailed(true)}/>:<Image src={requested} alt={alt} fill priority={priority} sizes="(max-width: 480px) 50vw, (max-width: 768px) 80vw, 360px" style={{objectPosition:effectivePosition,objectFit:"cover"}} unoptimized={requested.startsWith("/api/")} onLoad={loaded} onError={()=>setFailed(true)}/>):<UserRound aria-label={alt}/>}</span>;
}
