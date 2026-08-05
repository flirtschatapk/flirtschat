"use client";
import {BadgeCheck,Bell,Crown,Gift,Heart,MessageCircle} from "lucide-react";
import {useCallback,useEffect,useState} from "react";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {DesktopSidebar} from "@/components/dashboard/desktop-sidebar";
import {ProfileImage} from "@/components/profile-image";
import {createClient} from "@/lib/supabase/client";

type Match={id:string;profileId:string;name:string;username:string|null;avatarUrl:string|null;online:boolean;verified:boolean;premium:boolean;created:string};
type MatchRow={match_id:string;profile_id:string;display_name:string|null;username:string|null;last_seen_at:string|null;verified:boolean|null;premium:boolean|null;matched_at:string;photo_key:string|null};

export function MatchesExperience(){
  const[items,setItems]=useState<Match[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const load=useCallback(async()=>{
    const supabase=createClient();setError("");
    const{data:{user}}=await supabase.auth.getUser();
    if(!user){setError("Please sign in");setLoading(false);return}
    const{data,error:matchError}=await supabase.rpc("fc_my_matches");
    if(matchError){console.error("[matches] query failed",{code:matchError.code});setError("Matches couldn't load.");setLoading(false);return}
    setItems(((data??[])as MatchRow[]).map(row=>({
      id:row.match_id,profileId:row.profile_id,name:row.display_name||row.username||"New user",username:row.username||null,
      avatarUrl:row.photo_key?`/api/media/profile-photo?key=${encodeURIComponent(row.photo_key)}`:null,
      online:row.last_seen_at?Date.now()-new Date(row.last_seen_at).getTime()<300000:false,verified:Boolean(row.verified),premium:Boolean(row.premium),created:new Date(row.matched_at).toLocaleDateString(),
    })));
    setLoading(false);
  },[]);
  useEffect(()=>{void load();const supabase=createClient();const channel=supabase.channel("current-user-matches").on("postgres_changes",{event:"*",schema:"public",table:"fc_matches"},()=>void load()).subscribe();return()=>{void supabase.removeChannel(channel)}},[load]);
  return <main className="matches-page"><DesktopSidebar active="matches"/><div className="matches-shell"><header className="matches-top-header"><a className="matches-brand" href="/matches">FLIRTSCHAT</a><div><a className="matches-header-action premium" href="/premium"><Crown/></a><a className="matches-header-action notification" href="/notifications"><Bell/></a></div></header><div className="matches-tabs"><button className="active"><Heart/><span>All Matches</span><b>{items.length}</b></button></div><section className="matches-list">{loading?<p>Loading matches…</p>:error?<p>{error}<button type="button" onClick={()=>void load()}>Retry</button></p>:items.length?items.map(person=><article className="match-person-card" key={person.id}><a className="match-person-avatar" href={`/profile/${person.profileId}`}><ProfileImage src={person.avatarUrl} alt={person.name}/><i className={person.online?"online":""}/></a><div className="match-person-copy"><a href={`/profile/${person.profileId}`}><h2>{person.name}{person.verified&&<BadgeCheck/>}</h2></a>{person.username&&<p>@{person.username}</p>}<small>{person.created}</small></div>{person.premium&&<Crown/>}<a className="match-message-button" href={`/chats/${person.id}`}><MessageCircle/></a><a className="match-message-button" href={`/gifts?to=${person.profileId}`}><Gift/></a></article>):<p>No matches yet.</p>}</section></div><AppBottomNav active="matches"/></main>;
}
