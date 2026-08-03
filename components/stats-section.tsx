import { Globe2, HeartHandshake, ShieldCheck, Users } from "lucide-react";import { stats } from "@/data/landing-page";
const icons=[Users,HeartHandshake,Globe2,ShieldCheck];
export function StatsSection(){return <section aria-label="Flirtschat statistics" className="stats-wrap"><div className="container stats-grid">{stats.map(([n,l],i)=>{const Icon=icons[i];return <div className="stat" key={l}><span><Icon/></span><div><strong>{n}</strong><small>{l}</small></div></div>})}</div></section>}
