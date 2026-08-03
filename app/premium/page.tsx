"use client";

import {BadgeCheck, CalendarDays, Check, ChevronDown, CreditCard, Crown, Gift, Infinity, LoaderCircle, LockKeyhole, RotateCcw, Rocket, ShieldCheck, Sparkles, Star, X, Zap} from "lucide-react";
import Link from "next/link";
import {useEffect, useState} from "react";
import {isPremiumUser, setPremiumUser} from "@/lib/discover-entitlements";

type PlanId = "monthly" | "quarterly" | "yearly";
type Plan = {id: PlanId; name: string; price: string; cadence: string; note: string; badge?: string};

const plans: Plan[] = [
  {id: "monthly", name: "Monthly", price: "$9.99", cadence: "/ month", note: "Flexible monthly access"},
  {id: "quarterly", name: "3 Months", price: "$24.99", cadence: "/ 3 months", note: "Save 16%", badge: "Popular"},
  {id: "yearly", name: "Yearly", price: "$69.99", cadence: "/ year", note: "Save 42%", badge: "Best value"},
];

const benefits = [
  {icon: RotateCcw, label: "Unlimited Rewinds"},
  {icon: Star, label: "Unlimited Super Likes"},
  {icon: Rocket, label: "Profile Boosts"},
  {icon: Infinity, label: "Premium chat features"},
  {icon: BadgeCheck, label: "Stand out everywhere"},
  {icon: Sparkles, label: "Exclusive discovery tools"},
];

export default function PremiumPage() {
  const [selected, setSelected] = useState<PlanId>("quarterly");
  const [premium, setPremium] = useState(false);
  const [activePlan, setActivePlan] = useState<PlanId | null>(null);
  const [saving, setSaving] = useState(false);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState("");

  useEffect(() => {
    setPremium(isPremiumUser());
    const saved = localStorage.getItem("flirtschat:premium-plan") as PlanId | null;
    if (saved && plans.some(plan => plan.id === saved)) {
      setActivePlan(saved);
      setSelected(saved);
    }
    setCancelAtPeriodEnd(localStorage.getItem("flirtschat:premium-cancel-at-period-end") === "true");
  }, []);

  const plan = plans.find(item => item.id === selected) ?? plans[1];
  const subscribe = async () => {
    if (saving) return;
    setSaving(true);
    await new Promise(resolve => window.setTimeout(resolve, 900));
    localStorage.setItem("flirtschat:premium-plan", selected);
    localStorage.setItem("flirtschat:premium-started-at", new Date().toISOString());
    setPremiumUser(true);
    setPremium(true);
    setActivePlan(selected);
    setCancelAtPeriodEnd(false);
    localStorage.removeItem("flirtschat:premium-cancel-at-period-end");
    setSaving(false);
  };

  const renewalDate=()=>{const started=new Date(localStorage.getItem("flirtschat:premium-started-at")??Date.now());if(activePlan==="monthly")started.setMonth(started.getMonth()+1);else if(activePlan==="quarterly")started.setMonth(started.getMonth()+3);else started.setFullYear(started.getFullYear()+1);return started.toLocaleDateString(undefined,{month:"long",day:"numeric",year:"numeric"})};
  const toggleCancellation=()=>{const next=!cancelAtPeriodEnd;setCancelAtPeriodEnd(next);localStorage.setItem("flirtschat:premium-cancel-at-period-end",String(next))};
  const applyPromo=()=>{const code=promo.trim().toUpperCase();setPromoMessage(code==="FLIRT10"?"FLIRT10 applied — 10% will be reflected at checkout.":code?"That promo code is not available.":"Enter a promo code first.")};

  return <main className="premium-page-modern">
    <div className="premium-ambient"/>
    <header className="premium-topbar">
      <Link href="/discover" className="premium-brand">FLIRTSCHAT</Link>
      <Link href="/chats" aria-label="Close premium packages"><X/></Link>
    </header>

    <section className="premium-shell">
      <div className="premium-package-hero">
        <div className="premium-page-crown"><Crown/></div>
        <span>Flirtschat Premium</span>
        <h1>Unlock Unlimited<br/>Connections</h1>
        <p>Match faster, stand out, and enjoy every premium dating feature without limits.</p>
      </div>

      <div className="premium-benefits">
        {benefits.map(({icon: Icon, label}) => <div key={label}><Icon/><span>{label}</span><Check/></div>)}
      </div>

      <section className="premium-plans" aria-labelledby="choose-plan-title">
        <header><span>Choose your package</span><h2 id="choose-plan-title">Find your perfect plan</h2></header>
        <div className="premium-plan-grid" role="radiogroup" aria-label="Premium subscription packages">
          {plans.map(item => <button type="button" role="radio" aria-checked={selected === item.id} className={selected === item.id ? "selected" : ""} onClick={() => setSelected(item.id)} key={item.id}>
            {item.badge && <b>{item.badge}</b>}
            <span className="premium-radio"><i/></span>
            <strong>{item.name}</strong>
            <div><em>{item.price}</em><small>{item.cadence}</small></div>
            <p>{item.note}</p>
          </button>)}
        </div>

        <div className="premium-checkout-summary">
          <div><small>Selected package</small><strong>{plan.name}</strong></div>
          <div><small>Due today</small><strong>{plan.price}</strong></div>
        </div>

        {premium && <div className="premium-active-notice" role="status"><BadgeCheck/><span><strong>Premium is active</strong><small>Your {plans.find(item => item.id === activePlan)?.name ?? "selected"} package is ready.</small></span></div>}

        <button className="premium-subscribe" type="button" disabled={saving || (premium && activePlan === selected)} onClick={() => void subscribe()}>
          {saving ? <><LoaderCircle className="spin"/>Activating package…</> : premium && activePlan === selected ? <><Check/>Current package</> : <><Crown/>{premium ? "Switch package" : "Subscribe to Premium"}</>}
        </button>
        <p className="premium-terms">Mock checkout for development. Cancel anytime. Real payment processing can be connected later.</p>
        {premium && <Link className="premium-continue" href="/discover">Continue with Premium</Link>}
      </section>

      {premium&&<section className="premium-manage" aria-labelledby="manage-subscription-title">
        <header><span>Your membership</span><h2 id="manage-subscription-title">Manage subscription</h2><p>See your plan details and control renewal from one place.</p></header>
        <div className="premium-manage-card">
          <div className="premium-plan-status"><i><Crown/></i><span><small>Current plan</small><strong>Flirtschat Premium · {plans.find(item=>item.id===activePlan)?.name}</strong><em><BadgeCheck/> Active</em></span></div>
          <div className="premium-billing-details"><div><CalendarDays/><span><small>{cancelAtPeriodEnd?"Access ends":"Next renewal"}</small><strong>{renewalDate()}</strong></span></div><div><CreditCard/><span><small>Renewal price</small><strong>{plans.find(item=>item.id===activePlan)?.price}</strong></span></div></div>
          <div className="premium-manage-actions"><button type="button" onClick={toggleCancellation}>{cancelAtPeriodEnd?"Resume auto-renewal":"Cancel renewal"}</button><a href="mailto:support@flirtschat.com?subject=Premium%20billing%20support">Get billing help</a></div>
          {cancelAtPeriodEnd&&<p className="premium-cancel-notice">Your Premium access stays active until {renewalDate()}. You can resume renewal at any time before then.</p>}
        </div>
      </section>}

      <section className="premium-compare" aria-labelledby="compare-title"><header><span>Everything included</span><h2 id="compare-title">Free vs. Premium</h2></header><div className="premium-compare-table"><div className="premium-compare-head"><strong>Feature</strong><strong>Free</strong><strong>Premium</strong></div>{[["Daily likes","Limited","Unlimited"],["Rewinds","—","Unlimited"],["Super Likes","Limited","Unlimited"],["Profile boosts","—","Included"],["Incognito mode","—","Included"],["Premium chat tools","—","Included"]].map(row=><div key={row[0]}><span>{row[0]}</span><span>{row[1]}</span><strong><Check/>{row[2]}</strong></div>)}</div></section>

      <section className="premium-extras"><div className="premium-extra-card"><i><Gift/></i><span><small>Have a code?</small><h3>Apply a promo</h3><p>Enter your code before choosing a package.</p><div><input value={promo} onChange={event=>{setPromo(event.target.value);setPromoMessage("")}} placeholder="PROMO CODE" aria-label="Promo code"/><button type="button" onClick={applyPromo}>Apply</button></div>{promoMessage&&<em className={promoMessage.startsWith("FLIRT10")?"valid":""} role="status">{promoMessage}</em>}</span></div><div className="premium-extra-card"><i><ShieldCheck/></i><span><small>Purchase protection</small><h3>Secure and flexible</h3><p>Encrypted checkout, transparent renewals, and easy subscription controls.</p><ul><li><LockKeyhole/>Secure payment processing ready</li><li><Zap/>Premium activates instantly</li><li><CalendarDays/>Cancel renewal anytime</li></ul></span></div></section>

      <section className="premium-faq" aria-labelledby="premium-faq-title"><header><span>Good to know</span><h2 id="premium-faq-title">Premium questions</h2></header>{[["When does Premium activate?","Premium features activate as soon as checkout completes and remain available across your Flirtschat experience."],["Can I change my plan?","Yes. Select another package above and choose Switch package. Your membership details update immediately in this development experience."],["How does cancellation work?","Canceling turns off the next renewal. You keep Premium benefits through the date shown in Manage subscription."],["Where can I get billing help?","Email support@flirtschat.com with your account email and a description of the issue. Never send full card details."]].map(([q,a])=><details key={q}><summary>{q}<ChevronDown/></summary><p>{a}</p></details>)}</section>
    </section>
  </main>;
}

