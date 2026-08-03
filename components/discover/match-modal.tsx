"use client";

import {AnimatePresence, motion, useReducedMotion} from "framer-motion";
import {Heart, LoaderCircle, MessageCircle} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect, useRef, useState} from "react";
import {ProfileImage} from "@/components/profile-image";
import {updateMatchStatus} from "@/lib/match-storage";
import type {DiscoverProfile} from "@/lib/discover-types";

export function MatchModal({profile, onClose}: {profile: DiscoverProfile | null; onClose: () => void}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const actionLock = useRef(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!profile) setSending(false);
  }, [profile]);

  const sendMessage = async () => {
    if (!profile || actionLock.current) return;
    actionLock.current = true;
    setSending(true);
    updateMatchStatus(profile.id, "messaged");
    await new Promise(resolve => setTimeout(resolve, 280));
    router.push(`/chats/${profile.id}`);
  };

  const keepDiscovering = () => {
    if (!profile || actionLock.current) return;
    actionLock.current = true;
    updateMatchStatus(profile.id, "dismissed");
    onClose();
    setTimeout(() => { actionLock.current = false; }, 300);
  };

  useEffect(() => {
    if (!profile) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") keepDiscovering();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  });

  return <AnimatePresence>{profile && <motion.div className="match-backdrop" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
    <motion.div className="match-modal glass" role="dialog" aria-modal="true" aria-labelledby="match-title" initial={reduce ? false : {scale: .65, y: 30}} animate={{scale: 1, y: 0}} exit={{opacity: 0, scale: .85}}>
      {!reduce && <div className="match-confetti" aria-hidden="true">{Array.from({length: 10}, (_, index) => <i key={index}/>)}</div>}
      <Heart className="match-heart"/>
      <span id="match-title">It&apos;s a Match!</span>
      <h2>You and {profile.name} liked each other</h2>
      <div className="match-avatars">
        <ProfileImage position="50% 100%"/>
        <ProfileImage position={profile.photos[0]}/>
      </div>
      <button className="match-message" type="button" disabled={sending} onClick={() => void sendMessage()}>
        {sending ? <><LoaderCircle className="spin"/>Opening chat…</> : <><MessageCircle/>Send Message</>}
      </button>
      <button className="match-keep" type="button" disabled={sending} onClick={keepDiscovering}>Keep Discovering</button>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}
