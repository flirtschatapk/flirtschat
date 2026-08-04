"use client";
/* eslint-disable @next/next/no-img-element -- remote profile hosts are user data and cannot be safely enumerated in next.config */

import Image from "next/image";
import {UserRound} from "lucide-react";
import {useEffect,useState} from "react";

type ProfileImageProps={position?:string;className?:string;alt?:string;src?:string|null};
function safeSource(value:string|null|undefined){if(!value)return null;const source=value.trim();return source.startsWith("/")||source.startsWith("https://")?source:null}

export function ProfileImage({position="0% 0%",className="",alt="Flirtschat member",src="/images/profiles.png"}:ProfileImageProps){
  const positionUrl=safeSource(position),requested=positionUrl??safeSource(src),[failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[requested]);
  const isSprite=requested==="/images/profiles.png",isRemote=Boolean(requested?.startsWith("https://")),effectivePosition=positionUrl?"50% 50%":position;
  return <span className={`profile-image ${isSprite?"profile-image--sprite":"profile-image--asset"} ${className}`.trim()}>{requested&&!failed?(isRemote?<img src={requested} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{objectPosition:effectivePosition,objectFit:"cover"}} onError={()=>setFailed(true)}/>:<Image src={requested} alt={alt} fill sizes="(max-width: 480px) 50vw, (max-width: 768px) 80vw, 360px" style={{objectPosition:effectivePosition,objectFit:"cover"}} unoptimized={requested.startsWith("/api/")} onError={()=>setFailed(true)}/>):<UserRound aria-label={alt}/>}</span>;
}
