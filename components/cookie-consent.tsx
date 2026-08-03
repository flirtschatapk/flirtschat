"use client";

import { Cookie, Settings2, X } from "lucide-react";
import { useEffect, useState } from "react";

const CONSENT_KEY = "flirtschat:cookie-consent";
type Consent = { necessary: true; analytics: boolean; marketing: boolean; savedAt: string };

export function CookieConsent() {
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try { setOpen(!localStorage.getItem(CONSENT_KEY)); } catch { setOpen(true); }
    setReady(true);
  }, []);

  const save = (next: Pick<Consent, "analytics" | "marketing">) => {
    const value: Consent = { necessary: true, ...next, savedAt: new Date().toISOString() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch {}
    setOpen(false);
    setSettings(false);
    window.dispatchEvent(new CustomEvent("flirtschat:cookie-consent", { detail: value }));
  };

  if (!ready || !open) return null;

  return <div className="cookie-layer" role="region" aria-label="Cookie consent">
    <section className="cookie-card glass">
      <div className="cookie-icon" aria-hidden="true"><Cookie /></div>
      <div className="cookie-copy">
        <div className="cookie-title-row"><h2>Your privacy, your choice</h2><button type="button" onClick={() => save({analytics:false,marketing:false})} aria-label="Close and reject optional cookies"><X /></button></div>
        <p>We use necessary cookies to keep Flirtschat secure. Optional cookies help us improve your experience and show more relevant content.</p>
        {settings && <div className="cookie-preferences" id="cookie-preferences">
          <CookieToggle label="Necessary" description="Security, authentication and core features." checked disabled onChange={() => {}} />
          <CookieToggle label="Analytics" description="Helps us understand and improve app performance." checked={analytics} onChange={setAnalytics} />
          <CookieToggle label="Personalization" description="Allows more relevant recommendations and offers." checked={marketing} onChange={setMarketing} />
        </div>}
        <nav className="cookie-links" aria-label="Privacy links"><a href="#privacy">Privacy Policy</a><span>·</span><a href="#cookies">Cookie Policy</a></nav>
      </div>
      <div className="cookie-actions">
        {settings ? <button className="cookie-secondary" type="button" onClick={() => save({analytics,marketing})}>Save choices</button> : <button className="cookie-secondary" type="button" aria-expanded={settings} aria-controls="cookie-preferences" onClick={() => setSettings(true)}><Settings2 /> Customize</button>}
        <button className="cookie-reject" type="button" onClick={() => save({analytics:false,marketing:false})}>Reject optional</button>
        <button className="cookie-accept" type="button" onClick={() => save({analytics:true,marketing:true})}>Accept all</button>
      </div>
    </section>
  </div>;
}

function CookieToggle({label,description,checked,disabled=false,onChange}:{label:string;description:string;checked:boolean;disabled?:boolean;onChange:(value:boolean)=>void}) {
  return <label className={`cookie-toggle ${disabled?"disabled":""}`}><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} disabled={disabled} onChange={event=>onChange(event.target.checked)} /><i aria-hidden="true" /></label>;
}
