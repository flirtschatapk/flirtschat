"use client";

import {motion,useReducedMotion} from "framer-motion";
import {Heart} from "lucide-react";
import Image from "next/image";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useState} from "react";
import {WELCOME_KEY} from "@/components/root-visitor-gate";

const SPLASH_DURATION=2800;
const MOBILE_QUERY="(max-width: 767px)";

export function SplashScreen(){
  const pathname=usePathname(),router=useRouter(),reduce=useReducedMotion();
  const [visible,setVisible]=useState(false);

  useEffect(()=>{
    if(pathname!=="/"){setVisible(false);return}
    if(!window.matchMedia(MOBILE_QUERY).matches){setVisible(false);return}
    try{if(localStorage.getItem(WELCOME_KEY)==="true"){setVisible(false);return}}catch{}
    setVisible(true);
    const finish=window.setTimeout(()=>{try{localStorage.setItem(WELCOME_KEY,"true")}catch{}router.replace("/login")},SPLASH_DURATION);
    return()=>{
      window.clearTimeout(finish);
    };
  },[pathname,router]);

  if(pathname!=="/"||!visible)return null;

  return <motion.div className="fc-splash" initial={false} animate={{opacity:1}} role="status" aria-label="Flirtschat is loading" aria-live="polite">
    <div className="fc-splash-particles" aria-hidden="true">{Array.from({length:12},(_,index)=><i key={index}/>)}</div>
    <motion.div className="fc-splash-hero" initial={reduce?false:{opacity:0,scale:1.035}} animate={{opacity:1,scale:1}} transition={{duration:1,ease:"easeOut"}}>
      <Image src="/images/splash/flirtschat-couple.webp" alt="A smiling couple together beneath a pink and blue neon halo" fill priority sizes="100vw"/>
    </motion.div>
    <div className="fc-splash-fade" aria-hidden="true"/>
    <div className="fc-splash-content">
      <motion.div className="fc-splash-brand" initial={reduce?false:{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.65,delay:.25}}>
        <h1>FLIRTSCHAT</h1>
        <p>GEN Z DATING APP</p>
      </motion.div>
      <motion.div className="fc-splash-tagline" initial={reduce?false:{opacity:0}} animate={{opacity:1}} transition={{duration:.6,delay:.65}}><p>Find your vibe.<br/>Match. Chat. Connect.</p></motion.div>
      <div className="fc-splash-heart" aria-hidden="true"><Heart/></div>
      <div className="fc-splash-loader"><span>LOADING LOVE...</span><div className="fc-splash-track"><i className={reduce?"reduced":""}/></div></div>
    </div>
  </motion.div>;
}
