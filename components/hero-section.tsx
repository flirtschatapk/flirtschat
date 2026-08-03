"use client";

import {motion, useReducedMotion} from "framer-motion";
import {Heart, MessageCircleHeart, Play, ShieldCheck, Star} from "lucide-react";
import Image from "next/image";
import {ProfileImage} from "./profile-image";

export function HeroSection(){
  const reduce=useReducedMotion();
  return <section id="home" className="hero landing-hero section">
    <div className="landing-hero-aura" aria-hidden="true"/>
    <div className="container landing-hero-shell">
      <motion.div className="landing-hero-copy" initial={reduce?false:{opacity:0,y:22}} animate={{opacity:1,y:0}} transition={{duration:.65}}>
        <div className="landing-hero-kicker"><Star size={13} fill="currentColor"/> #1 Dating App for Gen Z Real Connections</div>
        <h1>Find Your Spark.<br/><span>Feel the Connection.</span></h1>
        <p>Meet real people, build meaningful connections, and spark something unforgettable.</p>
        <div className="landing-hero-actions">
          <a className="btn btn-gradient" href="/signup"><MessageCircleHeart/>Start Matching Now</a>
          <a className="btn landing-hero-learn" href="#features"><Play fill="currentColor"/>Learn More</a>
        </div>
        <div className="landing-hero-trust">
          <span><ShieldCheck/>Safe &amp; verified</span>
          <i/>
          <span><Heart fill="currentColor"/>500K+ connections</span>
        </div>
      </motion.div>

      <motion.div className="landing-hero-visual" initial={reduce?false:{opacity:0,scale:.97,x:24}} animate={{opacity:1,scale:1,x:0}} transition={{duration:.85,delay:.08}} aria-label="A couple discovering a meaningful connection through Flirtschat">
        <Image className="landing-couple" src="/images/landing-hero-couple.png" alt="A smiling couple looking at each other under a pink neon halo" fill priority sizes="(max-width: 900px) 100vw, 62vw"/>
        <div className="landing-match-card">
          <div className="landing-match-avatars" aria-label="Matched male and female profiles"><span className="landing-match-avatar landing-match-male" role="img" aria-label="Matched male profile"/><span className="landing-match-avatar landing-match-female" role="img" aria-label="Matched female profile"/></div>
          <span><strong>It&apos;s a Match! <Heart fill="currentColor"/></strong><small>You and Sophia liked each other.</small></span>
        </div>
        <div className="landing-message-card">
          <ProfileImage position="0% 100%"/>
          <span><strong>Sophia</strong><small>Hey! You seem really interesting <span aria-hidden="true">😊</span></small></span>
        </div>
        <div className="landing-voice-card"><button aria-label="Play voice introduction"><Play fill="currentColor"/></button><i/><i/><i/><i/><i/><i/><i/><i/><span>0:12</span></div>
      </motion.div>
    </div>
  </section>;
}
