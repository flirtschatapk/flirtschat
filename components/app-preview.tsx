"use client";

import {AnimatePresence,motion} from "framer-motion";
import {BadgeCheck,Crown,Heart,MapPin,MessageCircle,RotateCcw,Search,SlidersHorizontal,Star,User,X} from "lucide-react";
import {useState} from "react";
import {ProfileImage} from "./profile-image";

const tabs=[
  {name:"Discover",icon:Search,pos:"100% 0%",nameLabel:"Imani",age:22,place:"Brooklyn, NY",match:92},
  {name:"Matches",icon:Heart,pos:"0% 100%",nameLabel:"Luca",age:24,place:"Miami, FL",match:96},
  {name:"Chat",icon:MessageCircle,pos:"50% 100%",nameLabel:"Nora",age:24,place:"Austin, TX",match:89},
  {name:"Profile",icon:User,pos:"0% 0%",nameLabel:"Your profile",age:24,place:"New York, NY",match:100},
];

export function AppPreview(){
  const [active,setActive]=useState(0),t=tabs[active];
  return <section className="section preview-section"><div className="container preview-layout">
    <div className="preview-copy"><span className="kicker">One app. Your pace.</span><h2>A better way to <em>meet.</em></h2><p>Express yourself beyond a bio, tune what you discover and keep every conversation in one calm, considered space.</p><div className="preview-tabs" role="tablist" aria-label="App previews">{tabs.map((item,index)=><button role="tab" aria-selected={active===index} className={active===index?"active":""} key={item.name} onClick={()=>setActive(index)}><item.icon/><span>{item.name}</span></button>)}</div></div>
    <div className="preview-stage"><div className="preview-glow"/><div className="preview-phone modern-preview-phone">
      <div className="preview-device-status"><time>9:41</time><i/><span>● ● ●</span></div>
      <div className="preview-bar"><span><small>FLIRTSCHAT</small><b>{t.name}</b></span><button aria-label="Open discovery filters"><SlidersHorizontal/></button></div>
      <AnimatePresence mode="wait"><motion.div className="preview-screen" key={t.name} initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-24}} transition={{duration:.25}}>
        {active<2?<ModernDiscover profile={t}/>:active===2?<ChatPreview profile={t}/>:<ProfilePreview profile={t}/>} 
      </motion.div></AnimatePresence>
      <div className="preview-bottom-nav" aria-hidden="true"><Search className={active===0?"active":""}/><Heart className={active===1?"active":""}/><MessageCircle className={active===2?"active":""}/><User className={active===3?"active":""}/></div><div className="phone-home"/>
    </div></div>
  </div></section>;
}

function ModernDiscover({profile}:{profile:(typeof tabs)[number]}){return <div className="modern-discover-card">
  <ProfileImage position={profile.pos} alt={`${profile.nameLabel} profile preview`}/><div className="modern-card-shade"/>
  <div className="modern-card-status"><span><i/>Online</span><b><Crown/>Premium</b></div>
  <div className="modern-card-copy"><span className="modern-match-score"><Heart fill="currentColor"/>{profile.match}% match</span><h3>{profile.nameLabel}, {profile.age}<BadgeCheck aria-label="Verified profile"/></h3><p><MapPin/>{profile.place}</p><div><i>Music</i><i>Travel</i><i>Food</i></div></div>
  <div className="modern-preview-actions"><button aria-label="Rewind profile"><RotateCcw/></button><button aria-label="Pass profile"><X/></button><button aria-label="Super Like profile"><Star fill="currentColor"/></button><button aria-label="Like profile"><Heart fill="currentColor"/></button></div>
 </div>}

function ChatPreview({profile}:{profile:(typeof tabs)[number]}){return <div className="chat-ui modern-chat-ui"><ProfileImage position={profile.pos}/><h3>{profile.nameLabel}<BadgeCheck/></h3><small>Online now</small><div className="bubble theirs">Your rooftop photo is unreal ✨</div><div className="bubble mine">Wait until you see the sunset.</div><div className="typing">typing ···</div></div>}

function ProfilePreview({profile}:{profile:(typeof tabs)[number]}){return <div className="profile-ui modern-profile-ui"><ProfileImage position={profile.pos}/><h3>{profile.nameLabel}<BadgeCheck/></h3><p>Complete your profile</p><div className="progress"><i/></div>{["My essentials","A perfect Sunday","Current anthem"].map(item=><span key={item}>{item}<b>+</b></span>)}</div>}
