"use client";

import Link from "next/link";
import {FormEvent,useState} from "react";
import {ArrowLeft,CheckCircle2,Clock3,Heart,Mail,MessageSquareText,Send,ShieldAlert} from "lucide-react";

export function ContactPage(){
  const [sent,setSent]=useState(false);
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    const data=new FormData(event.currentTarget);
    const name=String(data.get("name")??"").trim();
    const email=String(data.get("email")??"").trim();
    const topic=String(data.get("topic")??"General support");
    const message=String(data.get("message")??"").trim();
    const subject=encodeURIComponent(`Flirtschat support: ${topic}`);
    const body=encodeURIComponent(`Name: ${name}\nReply email: ${email}\nTopic: ${topic}\n\n${message}`);
    setSent(true);
    window.location.href=`mailto:support@flirtschat.com?subject=${subject}&body=${body}`;
  };

  return <main className="contact-page">
    <header className="contact-topbar"><Link href="/settings" aria-label="Back to settings"><ArrowLeft/></Link><Link href="/" className="contact-brand"><Heart/><strong>Flirts<span>chat</span></strong></Link><Link href="/help"><span>Help Center</span></Link></header>
    <section className="contact-hero"><span><MessageSquareText/></span><p>Contact Us</p><h1>Let’s get this sorted.</h1><p>Tell us what happened and our support team will point you in the right direction.</p></section>
    <div className="contact-layout">
      <section className="contact-form-card">
        <header><p>Send a message</p><h2>How can we help?</h2></header>
        <form onSubmit={submit}>
          <div className="contact-fields"><label><span>Your name</span><input name="name" type="text" autoComplete="name" placeholder="Enter your name" required/></label><label><span>Email address</span><input name="email" type="email" autoComplete="email" placeholder="you@example.com" required/></label></div>
          <label><span>What do you need help with?</span><select name="topic" defaultValue="Account & profile"><option>Account & profile</option><option>Login & security</option><option>Matches & messages</option><option>Safety concern</option><option>Premium & billing</option><option>Privacy request</option><option>Technical issue</option><option>General support</option></select></label>
          <label><span>Message</span><textarea name="message" rows={7} minLength={10} placeholder="Describe the issue and include any steps that may help us understand it…" required/></label>
          <p className="contact-privacy">Do not include your password, verification codes, or full payment-card information.</p>
          <button type="submit"><Send/>Prepare support email</button>
          {sent&&<p className="contact-sent" role="status"><CheckCircle2/>Your email app should now be open with your message ready to send.</p>}
        </form>
      </section>
      <aside className="contact-aside">
        <a className="contact-direct" href="mailto:support@flirtschat.com"><i><Mail/></i><span><small>Email us directly</small><strong>support@flirtschat.com</strong></span></a>
        <div className="contact-info"><Clock3/><div><strong>Response time</strong><p>We aim to respond as soon as possible. Complex safety or billing requests may take longer to investigate.</p></div></div>
        <div className="contact-info urgent"><ShieldAlert/><div><strong>Immediate danger?</strong><p>Contact local emergency services first. You can also block and report a member from their profile or conversation.</p><Link href="/settings/safety">Open Safety Center</Link></div></div>
        <div className="contact-help"><p>Looking for a quick answer?</p><h3>Visit the Help Center</h3><p>Browse account, privacy, safety, and billing guidance.</p><Link href="/help">Browse help articles</Link></div>
      </aside>
    </div>
    <footer className="contact-footer"><span>© 2026 Flirtschat. Made for Gen Z</span><Link href="/privacy">Terms & Privacy</Link></footer>
  </main>
}
