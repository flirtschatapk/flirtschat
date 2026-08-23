"use client";

import {BadgeCheck,Check,Clock3,LoaderCircle,MessageCircle,RefreshCcw,Search,UserPlus,UsersRound,X} from "lucide-react";
import {useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {DiscoverNavigation} from "./discover-navigation";
import {FlirtschatLoader} from "@/components/ui/flirtschat-loader";
import {FlirtschatSkeleton} from "@/components/ui/flirtschat-skeleton";
import {acceptConnection,cancelConnectionRequest,declineConnection,getConnectPeople,openConnectionConversation,requestConnection,type ConnectFilter,type ConnectPerson} from "@/lib/connect-service";
import {createClient} from "@/lib/supabase/client";
import {useCurrentProfile} from "@/components/profile/current-profile-provider";
import {ProfileImage} from "@/components/profile-image";
import {usePresence} from "@/components/presence/presence-provider";

const filters: {id: ConnectFilter; label: string}[] = [
  {id:"for_you",label:"For You"},{id:"nearby",label:"Nearby"},{id:"new",label:"New"},{id:"verified",label:"Verified"},
];

function ConnectSkeleton(){return <div className="connect-list-skeleton"><FlirtschatSkeleton variant="matches"/></div>}

export function DiscoverExperience(){
  const {user}=useCurrentProfile();
  const router=useRouter();
  const lock=useRef(false);
  const [people,setPeople]=useState<ConnectPerson[]>([]);
  const [filter,setFilter]=useState<ConnectFilter>("for_you");
  const [search,setSearch]=useState("");
  const [loading,setLoading]=useState(true);
  const [loadingMore,setLoadingMore]=useState(false);
  const [hasMore,setHasMore]=useState(false);
  const [before,setBefore]=useState<{createdAt:string;id:string}|null>(null);
  const [error,setError]=useState("");
  const [actionError,setActionError]=useState("");
  const [busyId,setBusyId]=useState<string|null>(null);

  const load=useCallback(async(reset=true,cursor:{createdAt:string;id:string}|null=null)=>{
    if(!user?.id)return;
    if(reset){setLoading(true);setBefore(null)}else setLoadingMore(true);
    setError("");
    try{
      const page=await getConnectPeople(filter,search,reset?null:cursor);
      setPeople(current=>reset?page.people:[...current,...page.people.filter(next=>!current.some(existing=>existing.id===next.id))]);
      setHasMore(page.hasMore);setBefore(page.nextBefore);
    }catch{setError("We couldn't load people right now.")}
    finally{setLoading(false);setLoadingMore(false)}
  },[filter,search,user?.id]);

  useEffect(()=>{const timer=window.setTimeout(()=>void load(true),search?220:0);return()=>window.clearTimeout(timer)},[filter,load,search,user?.id]);
  useEffect(()=>{
    if(!user?.id)return;
    const supabase=createClient();
    const channel=supabase.channel(`connect-relationships-${user.id}`).on("postgres_changes",{event:"*",schema:"public",table:"fc_connections"},()=>void load(true)).subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[load,user?.id]);

  const updatePerson=(id:string,changes:Partial<ConnectPerson>)=>setPeople(current=>current.map(person=>person.id===id?{...person,...changes}:person));
  const connect=async(person:ConnectPerson)=>{
    if(lock.current||busyId)return;lock.current=true;setBusyId(person.id);setActionError("");
    const previous={status:person.status,connectionId:person.connectionId};updatePerson(person.id,{status:"requested"});
    try{const result=await requestConnection(person.id);updatePerson(person.id,{status:result.status,connectionId:result.id})}
    catch{updatePerson(person.id,previous);setActionError("Could not send the connection request. Try again.")}
    finally{lock.current=false;setBusyId(null)}
  };
  const accept=async(person:ConnectPerson)=>{
    if(!person.connectionId||lock.current||busyId)return;lock.current=true;setBusyId(person.id);setActionError("");updatePerson(person.id,{status:"connected"});
    try{await acceptConnection(person.connectionId)}catch{updatePerson(person.id,{status:"incoming"});setActionError("Could not accept this request. Try again.")}
    finally{lock.current=false;setBusyId(null)}
  };
  const decline=async(person:ConnectPerson)=>{
    if(!person.connectionId||lock.current||busyId)return;lock.current=true;setBusyId(person.id);setActionError("");updatePerson(person.id,{status:"none",connectionId:null});
    try{await declineConnection(person.connectionId)}catch{updatePerson(person.id,{status:"incoming",connectionId:person.connectionId});setActionError("Could not decline this request. Try again.")}
    finally{lock.current=false;setBusyId(null)}
  };
  const cancel=async(person:ConnectPerson)=>{
    if(!person.connectionId||lock.current||busyId)return;lock.current=true;setBusyId(person.id);setActionError("");updatePerson(person.id,{status:"none"});
    try{await cancelConnectionRequest(person.connectionId);updatePerson(person.id,{connectionId:null})}catch{updatePerson(person.id,{status:"requested"});setActionError("Could not cancel this request. Try again.")}
    finally{lock.current=false;setBusyId(null)}
  };
  const openChat=async(person:ConnectPerson)=>{
    if(!person.connectionId||person.status!=="connected"||busyId)return;setBusyId(person.id);setActionError("");
    try{const conversationId=await openConnectionConversation(person.connectionId);if(process.env.NODE_ENV==="development")console.debug("[ConnectChatFlow]",{stage:"navigation-start",connectionId:person.connectionId,conversationId,authUserPresent:Boolean(user?.id),path:window.location.pathname});router.push(`/chats/${conversationId}`)}catch(error){if(process.env.NODE_ENV==="development")console.error("[ConnectChatFailure]",{stage:"open-chat",connectionId:person.connectionId,authUserPresent:Boolean(user?.id),path:window.location.pathname,errorCode:typeof error==="object"&&error&&"code"in error?String(error.code):null,errorMessage:error instanceof Error?error.message:"Conversation unavailable"});setActionError("This conversation is unavailable right now.");setBusyId(null)}
  };

  if(!user?.id)return <FlirtschatLoader context="discovery"/>;
  return <main className="connect-page">
    <DiscoverNavigation/>
    <section className="connect-shell" aria-labelledby="connect-title">
      <header className="connect-heading"><div><span className="connect-eyebrow">Meet people</span><h1 id="connect-title">Connect</h1></div><UsersRound aria-hidden="true"/></header>
      <label className="connect-search"><Search aria-hidden="true"/><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Search people" aria-label="Search people"/><kbd>⌘ K</kbd></label>
      <div className="connect-filters" role="tablist" aria-label="People filters">{filters.map(item=><button type="button" role="tab" aria-selected={filter===item.id} className={filter===item.id?"active":""} onClick={()=>setFilter(item.id)} key={item.id}>{item.label}</button>)}</div>
      {actionError&&<div className="connect-action-error" role="alert"><span>{actionError}</span><button type="button" onClick={()=>setActionError("")} aria-label="Dismiss error"><X/></button></div>}
      {loading&&people.length===0?<ConnectSkeleton/>:error&&people.length===0?<div className="connect-empty"><RefreshCcw/><h2>Couldn&apos;t load people</h2><p>{error}</p><button type="button" onClick={()=>void load(true)}><RefreshCcw/>Retry</button></div>:people.length===0?<div className="connect-empty"><UsersRound/><h2>{search?"No people found":"No new people to connect with right now."}</h2><p>Try another filter or check back soon.</p></div>:<div className="connect-list">{people.map(person=><ConnectRow key={person.id} person={person} busy={busyId===person.id} onConnect={()=>void connect(person)} onAccept={()=>void accept(person)} onDecline={()=>void decline(person)} onCancel={()=>void cancel(person)} onChat={()=>void openChat(person)}/>)}</div>}
      {hasMore&&<button type="button" className="connect-load-more" disabled={loadingMore} onClick={()=>void load(false,before)}>{loadingMore?<><LoaderCircle className="spin"/>Loading more</>:"Show more people"}</button>}
    </section>
  </main>;
}

function ConnectRow({person,busy,onConnect,onAccept,onDecline,onCancel,onChat}:{person:ConnectPerson;busy:boolean;onConnect:()=>void;onAccept:()=>void;onDecline:()=>void;onCancel:()=>void;onChat:()=>void}){
  const presence=usePresence(person.id);
  return <article className="connect-person-row">
    <Link className="connect-person-main" href={`/profile/${person.id}`} aria-label={`Open ${person.name}'s profile`}>
      <span className="connect-avatar">{person.photoUrl?<ProfileImage src={person.photoUrl} alt={`${person.name}'s profile photo`}/>:<UsersRound aria-hidden="true"/>}<i className={`connect-presence ${presence.online?"online":"offline"}`} aria-label={presence.online?"Online":"Offline"} title={presence.online?"Online":"Offline"}/></span>
      <span className="connect-person-copy"><span className="connect-name">{person.name}{person.age!==null&&<small>, {person.age}</small>}{person.verified&&<BadgeCheck aria-label="Verified"/>}</span><span className="connect-handle">{person.username?`@${person.username}`:"Flirtschat member"}</span><span className="connect-meta">{person.city||person.country||"Around Flirtschat"}</span></span>
    </Link>
    <div className="connect-row-action">{person.status==="none"&&<button type="button" className="connect-primary" onClick={onConnect} disabled={busy} aria-label={`Connect with ${person.name}`}>{busy?<LoaderCircle className="spin"/>:<><UserPlus/>Connect</>}</button>}{person.status==="requested"&&<><span className="connect-status requested"><Clock3/>Requested</span><button type="button" className="connect-secondary connect-undo" onClick={onCancel} disabled={busy} aria-label={`Undo request to ${person.name}`}>{busy?<LoaderCircle className="spin"/>:<X/>}</button></>}{person.status==="incoming"&&<><button type="button" className="connect-primary compact" onClick={onAccept} disabled={busy} aria-label={`Accept connection from ${person.name}`}>{busy?<LoaderCircle className="spin"/>:<><Check/>Accept</>}</button><button type="button" className="connect-secondary" onClick={onDecline} disabled={busy} aria-label={`Decline connection from ${person.name}`}><X/></button></>}{person.status==="connected"&&<><span className="connect-status"><Check/>Connected</span><button type="button" className="connect-chat" onClick={onChat} disabled={busy} aria-label={`Chat with ${person.name}`}>{busy?<LoaderCircle className="spin"/>:<MessageCircle/>}</button></>}</div>
  </article>;
}
