import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,Fingerprint,Heart,HeartHandshake,MessageCircleHeart,MessagesSquare,Radio,ScanHeart,ShieldCheck,UsersRound,Zap} from "lucide-react";

export const metadata:Metadata={title:"About Flirtschat",description:"FLIRTSCHAT — the Gen Z dating app for authentic connections."};

export default function AboutPage(){return <main className="about-page">
  <header className="about-topbar"><Link href="/settings" aria-label="Back to settings"><ArrowLeft/></Link><Link href="/" className="about-brand"><Heart/><strong>Flirts<span>chat</span></strong></Link><Link href="/contact">Contact</Link></header>
  <section className="about-hero"><div className="about-orbit"/><span className="about-heart"><Heart/></span><p>FLIRTSCHAT</p><h1>GEN Z<br/><em>DATING APP</em></h1><p className="about-lead">Built for real chemistry, better conversations, and connections that feel like you.</p><div className="about-actions"><Link href="/discover">Start discovering</Link><Link href="/settings/safety">Explore safety</Link></div></section>
  <div className="about-content">
    <section className="about-story">
      <div className="about-story-heading"><span><HeartHandshake/></span><p>Why we exist</p><h2>Dating should feel <em>human</em> again.</h2><div className="about-story-line"><i/><small>Real people. Real energy. Real connection.</small></div></div>
      <div className="about-story-copy"><p>Flirtschat is a modern dating experience designed around <strong>authentic profiles</strong>, <strong>shared energy</strong>, and conversations with personality. We help Gen Z meet people without turning connection into a numbers game.</p><blockquote><Heart/><span>Our goal is simple: create a welcoming space where people can show up as themselves.</span></blockquote><p>Discover compatible people and move naturally from a match to a meaningful conversation.</p><div className="about-story-steps"><span><i><ScanHeart/></i><small>Be yourself</small></span><b/><span><i><Radio/></i><small>Find your vibe</small></span><b/><span><i><MessagesSquare/></i><small>Start something real</small></span></div></div>
    </section>
    <section className="about-values"><header><p>What guides us</p><h2>Connection with intention</h2></header><div><AboutCard icon={<Fingerprint/>} title="Authenticity first" text="Profiles and discovery tools designed to highlight personality, interests, and genuine compatibility."/><AboutCard icon={<MessageCircleHeart/>} title="Better conversations" text="Modern messaging features that make it easier to break the ice and keep good energy flowing."/><AboutCard icon={<ShieldCheck/>} title="Safety by design" text="Privacy controls, reporting tools, and practical guidance that put community well-being first."/><AboutCard icon={<UsersRound/>} title="Inclusive community" text="A space for different identities, backgrounds, preferences, and ways of finding connection."/></div></section>
    <section className="about-manifesto"><Zap/><p>Our promise</p><h2>Less pressure.<br/>More personality.<br/><span>Better connections.</span></h2><p>We’re building Flirtschat for a generation that values honesty, consent, self-expression, and experiences that respect their time.</p></section>
    <section className="about-info"><div><small>Product</small><strong>Flirtschat</strong></div><div><small>Version</small><strong>1.0.0</strong></div><div><small>Built for</small><strong>Gen Z connections</strong></div><div><small>Support</small><a href="mailto:support@flirtschat.com">support@flirtschat.com</a></div></section>
    <footer className="about-footer"><span>© 2026 Flirtschat. Made for Gen Z</span><nav><Link href="/privacy">Terms & Privacy</Link><Link href="/help">Help Center</Link></nav></footer>
  </div>
</main>}

function AboutCard({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <article className="about-value-card"><i>{icon}</i><h3>{title}</h3><p>{text}</p></article>}
