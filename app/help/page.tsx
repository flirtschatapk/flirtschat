import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,ChevronRight,CircleHelp,CreditCard,Heart,KeyRound,Mail,MessageCircle,ShieldCheck,UserRound} from "lucide-react";

export const metadata:Metadata={title:"Help Center",description:"Find answers and contact Flirtschat support."};

const faqs=[
  ["How do I update my profile?","Open Settings, choose Account Information, then update your photos, bio, or personal details and save your changes."],
  ["How do I change discovery preferences?","Go to Settings → Discovery Preferences to adjust who you see, your distance, and other matching preferences."],
  ["How can I report or block someone?","Open the person’s profile or conversation, use the menu, then choose Report or Block. Reports are reviewed privately."],
  ["How do I manage notifications?","Open Settings to turn push and email updates on or off. You can also choose which email updates you receive."],
  ["How do I cancel Premium?","Cancel through the same app store or payment provider used to subscribe. Premium remains active until the end of the current billing period."],
  ["I cannot sign in. What should I do?","Confirm your email or phone details, check your connection, and use Forgot password on the login page. Contact support if you still cannot access your account."],
];

export default function HelpPage(){return <main className="help-page">
  <header className="help-topbar"><Link href="/settings" aria-label="Back to settings"><ArrowLeft/></Link><Link href="/" className="help-brand"><Heart/><strong>Flirts<span>chat</span></strong></Link><a href="mailto:support@flirtschat.com"><Mail/><span>Support</span></a></header>
  <section className="help-hero"><span><CircleHelp/></span><p>Flirtschat Support</p><h1>How can we help?</h1><p>Find quick answers, account guidance, and safety resources.</p></section>
  <div className="help-content">
    <section className="help-topics" aria-labelledby="help-topics-title"><header><p>Browse by topic</p><h2 id="help-topics-title">Get the right help, quickly</h2></header><div className="help-topic-grid">
      <HelpCard icon={<UserRound/>} title="Account & Profile" text="Profile details, photos, discovery, and settings" href="/settings"/>
      <HelpCard icon={<KeyRound/>} title="Login & Security" text="Password, devices, and account protection" href="/settings/security"/>
      <HelpCard icon={<MessageCircle/>} title="Matches & Messages" text="Matching, conversations, and notifications" href="/chats"/>
      <HelpCard icon={<ShieldCheck/>} title="Safety & Privacy" text="Block, report, privacy, and dating safety" href="/settings/safety"/>
      <HelpCard icon={<CreditCard/>} title="Premium & Billing" text="Plans, subscriptions, and payment help" href="/premium"/>
      <HelpCard icon={<CircleHelp/>} title="Terms & Policies" text="Read our terms and privacy policy" href="/privacy"/>
    </div></section>
    <section className="help-faq" aria-labelledby="faq-title"><header><p>Popular questions</p><h2 id="faq-title">Frequently asked questions</h2></header><div>{faqs.map(([question,answer])=><details key={question}><summary>{question}<ChevronRight/></summary><p>{answer}</p></details>)}</div></section>
    <section className="help-contact"><span><Mail/></span><div><p>Still need help?</p><h2>Talk to our support team</h2><p>Send us a description of the issue, the email linked to your account, and any useful screenshots. Never send your password or full payment-card details.</p><a href="mailto:support@flirtschat.com?subject=Flirtschat%20Support%20Request">support@flirtschat.com</a></div></section>
    <footer className="help-footer"><span>© 2026 Flirtschat. Made for Gen Z</span><Link href="/settings">Back to settings</Link></footer>
  </div>
</main>}

function HelpCard({icon,title,text,href}:{icon:React.ReactNode;title:string;text:string;href:string}){return <Link className="help-topic-card" href={href}><i>{icon}</i><span><strong>{title}</strong><small>{text}</small></span><ChevronRight/></Link>}
