"use client";

import {LoaderCircle} from "lucide-react";
import {useCallback, useEffect, useRef, useState} from "react";
import {ActionButtons, type DiscoverAction} from "./action-buttons";
import {DiscoverEmptyState} from "./discover-empty-state";
import {DiscoverFilter} from "./discover-filter";
import {DiscoverHeader} from "./discover-header";
import {DiscoverNavigation} from "./discover-navigation";
import {DiscoverTabs} from "./discover-tabs";
import {MatchModal} from "./match-modal";
import {ProfileCardSkeleton} from "./profile-card-skeleton";
import {ResponsiveProfileGallery} from "./responsive-profile-gallery";
import {ProfileDetailsSheet} from "./profile-details-sheet";
import {boostProfile, dislikeProfile, getDiscoveryActionState, getProfiles, likeProfile, rewindProfile, superLikeProfile, type DiscoveryActionState} from "@/lib/discover-service";
import type {DailyDiscoverQuota} from "@/lib/discover-entitlements";
import {defaultDiscoverFilters, type DiscoverFilters, type DiscoverProfile, type DiscoverTab} from "@/lib/discover-types";
import {DISCOVER_PREFERENCES_EVENT,DISCOVER_PREFERENCES_KEY,loadDiscoverPreferences,saveDiscoverPreferences} from "@/lib/discover-preferences";
import {createClient} from "@/lib/supabase/client";

export function DiscoverExperience() {
  const lock = useRef(false);
  const profilesRef=useRef<DiscoverProfile[]>([]);
  const [ready, setReady] = useState(false);
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [index, setIndex] = useState(0);
  const [tab, setTab] = useState<DiscoverTab>("discover");
  const [filters, setFilters] = useState<DiscoverFilters>(defaultDiscoverFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [match, setMatch] = useState<DiscoverProfile | null>(null);
  const [direction, setDirection] = useState({x: 0, y: 0});
  const [premium, setPremium] = useState(false);
  const [quota, setQuota] = useState<DailyDiscoverQuota>();
  const [limitNotice, setLimitNotice] = useState("");
  const [actionState,setActionState]=useState<DiscoveryActionState|null>(null);
  const [now,setNow]=useState(()=>Date.now());
  const active = profiles[index];
  const syncActionState=useCallback(async()=>{try{const state=await getDiscoveryActionState();setActionState(state);setPremium(state.premium);setQuota({date:new Date().toLocaleDateString("en-CA"),rewind:state.rewindsRemaining,superlike:state.superLikesRemaining})}catch{setLimitNotice("We couldn't load your swipe limits. Try again.")}},[]);

  const load = useCallback(async () => {
    setBusy(true);
    setError(false);
    try {
      setProfiles(await getProfiles(tab, filters));
      setIndex(0);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }, [tab, filters]);

  useEffect(() => {
    setFilters(loadDiscoverPreferences());
    setReady(true);
    void syncActionState();
  }, [syncActionState]);

  useEffect(()=>{profilesRef.current=profiles},[profiles]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  useEffect(()=>{if(!ready)return;const supabase=createClient(),channel=supabase.channel("public-profile-updates",{config:{private:true}}).on("broadcast",{event:"changed"},()=>void load()).subscribe();return()=>{void supabase.removeChannel(channel)}},[load,ready]);

  useEffect(()=>{const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[]);

  useEffect(()=>{if(!ready)return;const supabase=createClient();let channel:ReturnType<typeof supabase.channel>|null=null;void supabase.auth.getUser().then(({data})=>{if(!data.user)return;const userId=data.user.id;channel=supabase.channel(`discovery-actions-${userId}`).on("postgres_changes",{event:"INSERT",schema:"public",table:"fc_matches"},payload=>{const row=payload.new as {user_a?:string;user_b?:string},other=row.user_a===userId?row.user_b:row.user_b===userId?row.user_a:null;if(other){const profile=profilesRef.current.find(item=>item.id===other);if(profile)setMatch(profile)}void syncActionState()}).on("postgres_changes",{event:"*",schema:"public",table:"fc_profile_boosts",filter:`user_id=eq.${userId}`},()=>void syncActionState()).subscribe()});return()=>{if(channel)void supabase.removeChannel(channel)}},[ready,syncActionState]);

  useEffect(() => {
    const syncPreferences = () => setFilters(loadDiscoverPreferences());
    const storage = (event: StorageEvent) => { if (event.key === DISCOVER_PREFERENCES_KEY) syncPreferences(); };
    window.addEventListener(DISCOVER_PREFERENCES_EVENT, syncPreferences);
    window.addEventListener("storage", storage);
    return () => { window.removeEventListener(DISCOVER_PREFERENCES_EVENT, syncPreferences); window.removeEventListener("storage", storage); };
  }, []);

  const action = useCallback(async (kind: DiscoverAction, targetIndex = index) => {
    const target = profiles[targetIndex];
    if(lock.current)return;
    if(kind!=="rewind"&&kind!=="boost"&&!target)return;
    lock.current = true;
    setBusy(true);
    setLimitNotice("");
    const originalProfiles=profiles,originalIndex=index;
    try {
      if (kind === "rewind") {
        if(!actionState?.canRewind){setLimitNotice("No eligible swipe is available to rewind.");return}
        const result=await rewindProfile(),available=await getProfiles(tab,filters),restored=available.find(item=>item.id===result.profileId);
        if(restored){setProfiles(current=>[restored,...current.filter(item=>item.id!==restored.id)]);setIndex(0)}
        await syncActionState();
        return;
      }
      if (kind === "boost") {
        const result=await boostProfile();
        setActionState(current=>current?{...current,boostStartedAt:result.startedAt,boostExpiresAt:result.expiresAt,boostCooldownUntil:result.cooldownUntil}:current);
        return;
      }
      if(!target)return;
      setDirection(kind==="dislike"?{x:-700,y:0}:kind==="superlike"?{x:0,y:-700}:{x:700,y:0});
      setProfiles(current=>current.filter(profile=>profile.id!==target.id));
      setIndex(current=>Math.min(current,Math.max(0,profiles.length-2)));
      if (kind === "like") {
        const result = await likeProfile(target.id);
        if(result.matched)setMatch(target);
      }
      if(kind==="dislike")await dislikeProfile(target.id);
      if(kind==="superlike"){const result=await superLikeProfile(target.id);if(result.matched)setMatch(target)}
      await syncActionState();
    } catch(reason) {
      setProfiles(originalProfiles);setIndex(originalIndex);setDirection({x:0,y:0});
      const message=reason instanceof Error?reason.message:typeof reason==="object"&&reason&&"message" in reason?String(reason.message):"";
      setLimitNotice(message.includes("SUPER_LIKE_LIMIT")?"Your free daily Super Like is used. Premium gives unlimited access.":message.includes("REWIND_LIMIT")?"Your free daily Rewind is used. Premium gives unlimited access.":message.includes("BOOST_PREMIUM_REQUIRED")?"Boost is a Premium feature.":message.includes("BOOST_COOLDOWN")?"Boost is cooling down. Try again when the timer ends.":message.includes("NO_REWIND_AVAILABLE")?"No eligible swipe is available to rewind.":"Your action couldn't be saved. Check your connection and try again.");
      await syncActionState();
    } finally {
      setBusy(false);
      lock.current=false;
    }
  }, [actionState?.canRewind,filters,index,profiles,syncActionState,tab]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (details || filterOpen || match) return;
      if (event.key === "ArrowLeft") { event.preventDefault(); void action("dislike"); }
      if (event.key === "ArrowRight") { event.preventDefault(); void action("like"); }
      if (event.key === "ArrowUp") { event.preventDefault(); void action("superlike"); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [action, details, filterOpen, match]);

  if (!ready) return <main className="route-loading"><LoaderCircle className="spin"/><span>Finding your vibe…</span></main>;

  return <main className="discover-page discover-page-v2">
    <DiscoverNavigation/>
    <div className="discover-shell">
      <div className="discover-unified-header"><DiscoverHeader/><DiscoverTabs value={tab} onChange={setTab}/></div>
      <section className="discover-stage" aria-live="polite">
        {busy && profiles.length === 0 ? <ProfileCardSkeleton/> : error ? <DiscoverEmptyState type="error" onRetry={() => void load()}/> : !active ? <DiscoverEmptyState onRetry={() => void load()}/> : <>
          <ResponsiveProfileGallery profiles={profiles} index={index} busy={busy} direction={direction} onOpen={selectedIndex => { setIndex(selectedIndex); setDetails(true); }} onSwipe={nextAction => void action(nextAction)} renderDesktopActions={selectedIndex => <ActionButtons disabled={busy} premium={premium} quota={quota} canRewind={Boolean(actionState?.canRewind)} onAction={nextAction => void action(nextAction, selectedIndex)}/>} />
          <div className="discover-mobile-actions"><ActionButtons disabled={busy} premium={premium} quota={quota} canRewind={Boolean(actionState?.canRewind)} onAction={nextAction => void action(nextAction)}/></div>
          {busy && <span className="next-loading"><LoaderCircle className="spin"/>Loading next profile</span>}
        </>}
      </section>
    </div>
    {!limitNotice&&actionState?.boostExpiresAt&&new Date(actionState.boostExpiresAt).getTime()>now&&<div className="discover-limit-notice" role="status"><span>Boost active · {Math.max(0,Math.ceil((new Date(actionState.boostExpiresAt).getTime()-now)/60000))} min remaining</span></div>}
    {!limitNotice&&actionState?.boostExpiresAt&&actionState.boostCooldownUntil&&new Date(actionState.boostExpiresAt).getTime()<=now&&new Date(actionState.boostCooldownUntil).getTime()>now&&<div className="discover-limit-notice" role="status"><span>Boost cooldown · {Math.max(1,Math.ceil((new Date(actionState.boostCooldownUntil).getTime()-now)/60000))} min remaining</span></div>}
    {limitNotice && <div className="discover-limit-notice" role="alert"><span>{limitNotice}</span>{limitNotice.includes("Premium") && <a href="/premium">Get Premium</a>}<button type="button" onClick={() => setLimitNotice("")} aria-label="Dismiss">×</button></div>}
    <DiscoverFilter open={filterOpen} value={filters} onClose={() => setFilterOpen(false)} onApply={value=>{setFilters(value);saveDiscoverPreferences(value)}}/>
    <ProfileDetailsSheet profile={active ?? null} open={details} onClose={() => setDetails(false)}/>
    <MatchModal profile={match} onClose={() => setMatch(null)}/>
  </main>;
}
