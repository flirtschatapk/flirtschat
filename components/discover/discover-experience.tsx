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
import {boostProfile, dislikeProfile, getProfiles, likeProfile, rewindProfile, superLikeProfile} from "@/lib/discover-service";
import {consumeDailyDiscoverAction, isPremiumUser, loadDailyDiscoverQuota, type DailyDiscoverQuota} from "@/lib/discover-entitlements";
import {defaultDiscoverFilters, type DiscoverFilters, type DiscoverProfile, type DiscoverTab} from "@/lib/discover-types";
import {DISCOVER_PREFERENCES_EVENT,DISCOVER_PREFERENCES_KEY,loadDiscoverPreferences,saveDiscoverPreferences} from "@/lib/discover-preferences";
import {createClient} from "@/lib/supabase/client";

export function DiscoverExperience() {
  const lock = useRef(false);
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
  const active = profiles[index];

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
    setPremium(isPremiumUser());
    setFilters(loadDiscoverPreferences());
    setQuota(loadDailyDiscoverQuota());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  useEffect(()=>{if(!ready)return;const supabase=createClient(),channel=supabase.channel("discovery-profiles").on("postgres_changes",{event:"*",schema:"public",table:"fc_profiles"},()=>void load()).on("postgres_changes",{event:"*",schema:"public",table:"fc_profile_photos"},()=>void load()).subscribe();return()=>{void supabase.removeChannel(channel)}},[load,ready]);

  useEffect(() => {
    const syncEntitlements = () => {
      setPremium(isPremiumUser());
      setQuota(loadDailyDiscoverQuota());
    };
    window.addEventListener("storage", syncEntitlements);
    window.addEventListener("flirtschat:premium-change", syncEntitlements);
    window.addEventListener("flirtschat:quota-change", syncEntitlements);
    return () => {
      window.removeEventListener("storage", syncEntitlements);
      window.removeEventListener("flirtschat:premium-change", syncEntitlements);
      window.removeEventListener("flirtschat:quota-change", syncEntitlements);
    };
  }, []);

  useEffect(() => {
    const syncPreferences = () => setFilters(loadDiscoverPreferences());
    const storage = (event: StorageEvent) => { if (event.key === DISCOVER_PREFERENCES_KEY) syncPreferences(); };
    window.addEventListener(DISCOVER_PREFERENCES_EVENT, syncPreferences);
    window.addEventListener("storage", storage);
    return () => { window.removeEventListener(DISCOVER_PREFERENCES_EVENT, syncPreferences); window.removeEventListener("storage", storage); };
  }, []);

  const action = useCallback(async (kind: DiscoverAction, targetIndex = index) => {
    const target = profiles[targetIndex];
    if (lock.current || !target) return;
    if (kind === "rewind" && index === 0) {
      setLimitNotice("No previous profile to rewind.");
      return;
    }
    if (kind === "rewind" || kind === "superlike") {
      const access = consumeDailyDiscoverAction(kind);
      setQuota(access.quota);
      if (!access.allowed) {
        setLimitNotice(`Your free daily ${kind === "rewind" ? "Rewind" : "Super Like"} is used. Premium gives unlimited access.`);
        return;
      }
    }
    lock.current = true;
    setBusy(true);
    setLimitNotice("");
    try {
      if (kind === "rewind") {
        await rewindProfile();
        setIndex(current => Math.max(0, current - 1));
        return;
      }
      if (kind === "boost") {
        await boostProfile();
        return;
      }
      if (kind === "like") {
        setDirection({x: 700, y: 0});
        const result = await likeProfile(target.id);
        if (result.matched) {
          setMatch(target);
        }
      }
      if (kind === "dislike") {
        setDirection({x: -700, y: 0});
        await dislikeProfile(target.id);
      }
      if (kind === "superlike") {
        setDirection({x: 0, y: -700});
        await superLikeProfile(target.id);
      }
      if (targetIndex === index) setIndex(current => current + 1);
      else setProfiles(current => current.filter(profile => profile.id !== target.id));
    } finally {
      setBusy(false);
      setTimeout(() => { lock.current = false; }, 280);
    }
  }, [index, profiles]);

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
          <ResponsiveProfileGallery profiles={profiles} index={index} busy={busy} direction={direction} onOpen={selectedIndex => { setIndex(selectedIndex); setDetails(true); }} onSwipe={nextAction => void action(nextAction)} renderDesktopActions={selectedIndex => <ActionButtons disabled={busy} premium={premium} quota={quota} onAction={nextAction => void action(nextAction, selectedIndex)}/>} />
          <div className="discover-mobile-actions"><ActionButtons disabled={busy} premium={premium} quota={quota} onAction={nextAction => void action(nextAction)}/></div>
          {busy && <span className="next-loading"><LoaderCircle className="spin"/>Loading next profile</span>}
        </>}
      </section>
    </div>
    {limitNotice && <div className="discover-limit-notice" role="status"><span>{limitNotice}</span>{limitNotice.includes("Premium") && <a href="/premium">Get Premium</a>}<button type="button" onClick={() => setLimitNotice("")} aria-label="Dismiss">×</button></div>}
    <DiscoverFilter open={filterOpen} value={filters} onClose={() => setFilterOpen(false)} onApply={value=>{setFilters(value);saveDiscoverPreferences(value)}}/>
    <ProfileDetailsSheet profile={active ?? null} open={details} onClose={() => setDetails(false)}/>
    <MatchModal profile={match} onClose={() => setMatch(null)}/>
  </main>;
}
