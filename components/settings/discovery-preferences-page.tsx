"use client";

import {ArrowLeft,Check,Compass,Globe2,Heart,MapPin,RotateCcw,ShieldCheck,Sparkles,Users} from "lucide-react";
import Link from "next/link";
import {useEffect,useState} from "react";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {FlirtschatLoader} from "@/components/ui/flirtschat-loader";
import {DISCOVER_PREFERENCES_EVENT,DISCOVER_PREFERENCES_KEY,loadDiscoverPreferences,resetDiscoverPreferences,saveDiscoverPreferences} from "@/lib/discover-preferences";
import {type DiscoverFilters} from "@/lib/discover-types";
import {globalCountries} from "@/lib/global-countries";
import {getProfiles} from "@/lib/discover-service";
import {interests,relationshipGoals} from "@/lib/onboarding-schema";

export function DiscoveryPreferencesPage(){
  const [value,setValue]=useState<DiscoverFilters|null>(null),[saved,setSaved]=useState(false),[count,setCount]=useState<number|null>(null);
  useEffect(()=>{const sync=()=>setValue(loadDiscoverPreferences());sync();const storage=(event:StorageEvent)=>{if(event.key===DISCOVER_PREFERENCES_KEY)sync()};window.addEventListener(DISCOVER_PREFERENCES_EVENT,sync);window.addEventListener("storage",storage);return()=>{window.removeEventListener(DISCOVER_PREFERENCES_EVENT,sync);window.removeEventListener("storage",storage)}},[]);
  useEffect(()=>{if(!value)return;let active=true;setCount(null);void getProfiles("all",value).then(rows=>{if(active)setCount(rows.length)}).catch(()=>{if(active)setCount(0)});return()=>{active=false}},[value]);
  if(!value)return <FlirtschatLoader context="settings"/>;
  const change=<K extends keyof DiscoverFilters>(key:K,next:DiscoverFilters[K])=>{const updated={...value,[key]:next};setValue(updated);saveDiscoverPreferences(updated);setSaved(true);setTimeout(()=>setSaved(false),1800)};
  const toggleInterest=(item:string)=>change("interests",value.interests.includes(item)?value.interests.filter(current=>current!==item):[...value.interests,item]);
  const reset=()=>{const next=resetDiscoverPreferences();setValue(next);setSaved(true);setTimeout(()=>setSaved(false),1800)};
  return <main className="discovery-pref-page"><header className="discovery-pref-header"><Link href="/settings" aria-label="Back to settings"><ArrowLeft/></Link><div><h1>Discovery Preferences</h1><p>Manage who appears in your discovery</p></div><span><Compass/></span></header><div className="discovery-pref-shell">
    <section className="discovery-pref-summary"><i><Sparkles/></i><div><strong>{count===null?"Checking profiles…":`${count} profiles match`}</strong><small>Results update from live profile data as you change preferences.</small></div><Link href="/discover">Open Discover</Link></section>
    <PreferenceCard icon={<Users/>} title="Who you want to meet" detail="Age, identity and distance"><div className="pref-block"><label>Preferred age <b>{value.minAge}–{value.maxAge}</b></label><div className="pref-double-range"><input aria-label="Minimum age" type="range" min="18" max="79" value={value.minAge} onChange={event=>change("minAge",Math.min(Number(event.target.value),value.maxAge-1))}/><input aria-label="Maximum age" type="range" min="19" max="80" value={value.maxAge} onChange={event=>change("maxAge",Math.max(Number(event.target.value),value.minAge+1))}/></div></div><div className="pref-block"><label>Maximum distance <b>{value.maxDistance} mi</b></label><input aria-label="Maximum distance" type="range" min="1" max="200" value={value.maxDistance} onChange={event=>change("maxDistance",Number(event.target.value))}/></div><div className="pref-block"><label>Show me</label><div className="pref-segments">{(["Women","Men","Everyone"] as const).map(item=><button type="button" className={value.showMe===item?"active":""} onClick={()=>change("showMe",item)} key={item}>{item}</button>)}</div></div></PreferenceCard>
    <PreferenceCard icon={<ShieldCheck/>} title="Profile filters" detail="Prioritize the profiles that matter"><div className="pref-toggle-list"><PreferenceToggle label="Online only" detail="People active right now" value={value.onlineOnly} onChange={next=>change("onlineOnly",next)}/><PreferenceToggle label="Verified only" detail="Identity-verified profiles" value={value.verifiedOnly} onChange={next=>change("verifiedOnly",next)}/><PreferenceToggle label="Premium members" detail="Show Premium profiles only" value={value.premiumOnly} onChange={next=>change("premiumOnly",next)}/></div></PreferenceCard>
    <PreferenceCard icon={<Heart/>} title="Dating intentions" detail="Match around shared goals"><div className="pref-goals"><button type="button" className={!value.relationshipGoal?"active":""} onClick={()=>change("relationshipGoal","")}>Any goal</button>{relationshipGoals.map(goal=><button type="button" className={value.relationshipGoal===goal?"active":""} onClick={()=>change("relationshipGoal",goal)} key={goal}>{goal}</button>)}</div></PreferenceCard>
    <PreferenceCard icon={<Sparkles/>} title="Shared interests" detail="Select any interests you want to prioritize"><div className="pref-interests">{interests.map(item=><button type="button" className={value.interests.includes(item)?"active":""} onClick={()=>toggleInterest(item)} key={item}>{item}</button>)}</div></PreferenceCard>
    <PreferenceCard icon={<Globe2/>} title="Location" detail="Discover locally or around the world"><label className="pref-country"><MapPin/><select value={value.country} onChange={event=>change("country",event.target.value)}><option value="">Everywhere</option>{globalCountries.map(country=><option key={country}>{country}</option>)}</select></label></PreferenceCard>
    <button className="discovery-pref-reset" type="button" onClick={reset}><RotateCcw/>Reset all preferences</button>
  </div>{saved&&<div className="discovery-pref-toast" role="status"><Check/>Preferences saved</div>}<AppBottomNav active="settings"/></main>
}

function PreferenceCard({icon,title,detail,children}:{icon:React.ReactNode;title:string;detail:string;children:React.ReactNode}){return <section className="discovery-pref-card"><header><i>{icon}</i><div><h2>{title}</h2><p>{detail}</p></div></header>{children}</section>}
function PreferenceToggle({label,detail,value,onChange}:{label:string;detail:string;value:boolean;onChange:(value:boolean)=>void}){return <label><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" checked={value} onChange={event=>onChange(event.target.checked)}/><b><i/></b></label>}
