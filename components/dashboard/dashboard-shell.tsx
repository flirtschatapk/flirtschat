"use client";
/* eslint-disable @next/next/no-html-link-for-pages */

import {Bell,Crown,Globe2,LoaderCircle,MapPin,Search,SlidersHorizontal,Sparkles,X} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect,useState} from "react";
import {DashboardCard,TabButton} from "@/components/ui/dashboard-primitives";
import {ProfileImage} from "@/components/profile-image";
import {useCurrentProfile} from "@/components/profile/current-profile-provider";
import {HorizontalTabList} from "@/components/ui/horizontal-tab-list";
import {isPremiumUser} from "@/lib/discover-entitlements";
import {DesktopSidebar} from "./desktop-sidebar";
import {GlobalProfileGrid} from "./global-profile-grid";
import {MobileBottomNav} from "./mobile-bottom-nav";

const tabs=["For you","Nearby","New","Popular"] as const;

export function DashboardShell() {
  const router=useRouter();
  const {profile,loading,error,unauthorized,refresh}=useCurrentProfile();
  const [timedOut,setTimedOut]=useState(false),[filter,setFilter]=useState("For you"),[query,setQuery]=useState(""),[filtersOpen,setFiltersOpen]=useState(false),[verifiedOnly,setVerifiedOnly]=useState(false),[minLikes,setMinLikes]=useState(0),[welcomeVisible,setWelcomeVisible]=useState(true);
  useEffect(()=>{if(unauthorized)router.replace("/login");else if(profile&&!profile.onboardingCompleted)router.replace("/onboarding")},[profile,router,unauthorized]);
  useEffect(()=>{if(!loading){setTimedOut(false);return}const timeout=window.setTimeout(()=>setTimedOut(true),8000);return()=>window.clearTimeout(timeout)},[loading]);
  useEffect(()=>{try{setWelcomeVisible(localStorage.getItem("flirtschat:hide-global-welcome")!=="1")}catch{}},[]);
  const openFilters=()=>{if(!isPremiumUser()){router.push("/premium");return}setFiltersOpen(value=>!value)};
  if(loading||!profile)return <main className="route-loading">{error||timedOut?<><span>We&apos;re having trouble loading your account.</span><button type="button" onClick={()=>{setTimedOut(false);void refresh()}}>Retry</button></>:<><LoaderCircle className="spin"/><span>Opening your profile…</span></>}</main>;
  return <main className="dating-dashboard global-dashboard-clean dashboard-production">
    <DesktopSidebar mobileOpen={false} onClose={()=>{}}/>
    <div className="global-page-shell dashboard-container">
      <header className="global-page-header dashboard-top-header">
        <div className="dashboard-header-start"><a className="global-page-brand global-auth-brand flirtschat-wordmark" href="/dashboard" aria-label="Flirtschat dashboard"><strong>FLIRTSCHAT</strong></a></div>
        <div className="dashboard-header-actions"><a className="dashboard-premium-action dashboard-metallic-action" href="/premium" aria-label="Upgrade to Premium"><Crown/></a><a className="dashboard-icon-button dashboard-metallic-action dashboard-notification-action" href="/notifications" aria-label="Notifications"><Bell/><i/></a><a className="dashboard-profile-avatar dashboard-profile-photo" href="/profile" aria-label="Open profile"><ProfileImage src={profile?.primaryPhotoUrl||null} alt={profile?.displayName||"Your profile"}/></a></div>
      </header>

      {profile&&<DashboardCard className="dashboard-current-profile"><ProfileImage src={profile.primaryPhotoUrl||null} alt={profile.displayName||"Your profile"}/><div><small>@{profile.username}</small><h2>{profile.displayName||"Complete your profile"}</h2><p>{profile.bio||"Add a bio so people can get to know you."}</p><span>{[profile.city,profile.country].filter(Boolean).join(", ")||"Location not added"}</span></div><a href="/profile">Edit profile</a></DashboardCard>}

      {welcomeVisible&&<DashboardCard className="global-welcome dashboard-hero"><button className="global-welcome-close" type="button" aria-label="Hide welcome card" onClick={()=>{setWelcomeVisible(false);try{localStorage.setItem("flirtschat:hide-global-welcome","1")}catch{}}}><X/></button><div className="dashboard-hero-copy"><span><Sparkles/> Gen Z world is open</span><h1>Meet people beyond<br/><em>the usual circle.</em></h1><p>Explore authentic profiles shaped around shared energy—not an endless list of metrics.</p></div><div className="global-location-orb dashboard-hero-visual"><Globe2/><span><MapPin/> Worldwide</span></div></DashboardCard>}

      <section className="dashboard-discovery-section">
        <div className="global-feed-controls dashboard-feed-controls"><HorizontalTabList ariaLabel="Global feed filters">{tabs.map(item=><TabButton role="tab" type="button" active={filter===item} aria-selected={filter===item} onClick={()=>setFilter(item)} key={item}>{item}</TabButton>)}</HorizontalTabList><button type="button" className={`dashboard-filter-button ${filtersOpen?"active":""}`} aria-expanded={filtersOpen} onClick={openFilters} aria-label="Premium profile filters"><SlidersHorizontal/>Filters</button></div>
        <label className="global-tab-search dashboard-search"><Search/><input aria-label="Search global profiles" placeholder="Search name, @username, city or vibe" value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button type="button" onClick={()=>setQuery("")} aria-label="Clear search"><X/></button>}</label>
        {filtersOpen&&<div className="global-live-filters dashboard-live-filters"><label><input type="checkbox" checked={verifiedOnly} onChange={event=>setVerifiedOnly(event.target.checked)}/><span/>Verified profiles only</label><label><span>Minimum popularity</span><select value={minLikes} onChange={event=>setMinLikes(Number(event.target.value))}><option value={0}>Any</option><option value={100}>100+ loves</option><option value={150}>150+ loves</option><option value={200}>200+ loves</option></select></label><button type="button" onClick={()=>{setVerifiedOnly(false);setMinLikes(0);setQuery("");setFilter("For you")}}>Reset all</button></div>}
        <GlobalProfileGrid filter={filter} query={query} verifiedOnly={verifiedOnly} minLikes={minLikes}/>
      </section>
    </div>
    <MobileBottomNav/>
  </main>;
}
