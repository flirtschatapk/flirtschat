"use client";
import {AnimatePresence,motion,useReducedMotion} from "framer-motion";
import type {DiscoverProfile} from "@/lib/discover-types";
import {ProfileCard} from "./profile-card";

export function ProfileCardStack({profiles,index,busy,direction,onOpen,onSwipe}:{profiles:DiscoverProfile[];index:number;busy:boolean;direction:{x:number;y:number};onOpen:()=>void;onSwipe:(kind:"like"|"dislike"|"superlike")=>void}){
  const reduce=useReducedMotion(),active=profiles[index],next=profiles[index+1];
  if(!active)return null;
  return <div className={`profile-stack ${busy?"busy":""}`}>
    {next&&<motion.div className="stack-next" initial={false} animate={{scale:busy?1:0.965,y:busy?0:11}}><ProfileCard profile={next} onOpen={()=>{}}/></motion.div>}
    <AnimatePresence mode="popLayout"><motion.div className="stack-active" key={active.id} drag={busy?false:true} dragConstraints={{left:0,right:0,top:0,bottom:0}} dragElastic={0.85} onDragEnd={(_,info)=>{if(info.offset.y<-95)onSwipe("superlike");else if(info.offset.x>110)onSwipe("like");else if(info.offset.x<-110)onSwipe("dislike")}} initial={reduce?false:{opacity:0,scale:0.97}} animate={{opacity:1,x:0,y:0,rotate:0,scale:1}} exit={reduce?{opacity:0}:{opacity:0,x:direction.x,y:direction.y,rotate:direction.x/18,scale:0.94}} transition={{duration:reduce ? 0.01 : 0.3}}><ProfileCard profile={active} onOpen={onOpen}/></motion.div></AnimatePresence>
  </div>
}
