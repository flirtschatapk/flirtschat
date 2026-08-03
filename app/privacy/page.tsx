import type {Metadata} from "next";
import Link from "next/link";
import {ArrowLeft,FileText,Heart,Mail,ShieldCheck} from "lucide-react";

export const metadata:Metadata={
  title:"Terms & Privacy",
  description:"Flirtschat terms of service, privacy policy, and support contact information.",
};

const updated="July 31, 2026";

export default function PrivacyPage(){
  return <main className="legal-page">
    <header className="legal-topbar">
      <Link href="/settings" className="legal-back" aria-label="Back to settings"><ArrowLeft/></Link>
      <Link href="/" className="legal-brand"><Heart/><span>Flirts<span>chat</span></span></Link>
      <a href="mailto:support@flirtschat.com" className="legal-support"><Mail/><span>Support</span></a>
    </header>

    <div className="legal-layout">
      <aside className="legal-sidebar" aria-label="Policy navigation">
        <p>Terms & Policies</p>
        <a href="#terms">Terms of Service</a>
        <a href="#privacy">Privacy Policy</a>
        <a href="#safety">Safety & Conduct</a>
        <a href="#contact">Contact</a>
      </aside>

      <article className="legal-content">
        <section className="legal-hero">
          <span className="legal-icon"><FileText/></span>
          <p>Terms & Policies</p>
          <h1>Your trust matters.</h1>
          <p className="legal-intro">These terms explain the rules for using Flirtschat and how we collect, use, and protect your information.</p>
          <small>Effective and last updated: {updated}</small>
        </section>

        <section id="terms" className="legal-section">
          <div className="legal-section-title"><span>01</span><div><p>Terms of Service</p><h2>Using Flirtschat</h2></div></div>
          <PolicyBlock title="Eligibility and your account">
            <p>You must be at least 18 years old and legally able to enter a binding agreement to use Flirtschat. You agree to provide accurate information, keep your login details secure, maintain only one personal account, and promptly update information that changes. You are responsible for activity performed through your account.</p>
          </PolicyBlock>
          <PolicyBlock title="Acceptable use">
            <p>Use Flirtschat only for lawful, personal purposes. You may not impersonate others, misrepresent your age or identity, harass or exploit anyone, post illegal or infringing material, solicit money, distribute spam, scrape the service, bypass security controls, or use automation without our written permission.</p>
          </PolicyBlock>
          <PolicyBlock title="Your content">
            <p>You retain ownership of content you submit. You grant Flirtschat a worldwide, non-exclusive, royalty-free license to host, display, reproduce, adapt, and distribute that content only as needed to operate, improve, promote, and protect the service. You represent that you have the rights needed to share it. You can remove content through the app, subject to reasonable backup and legal-retention periods.</p>
          </PolicyBlock>
          <PolicyBlock title="Subscriptions and purchases">
            <p>Paid features, prices, billing periods, and renewal terms are shown before purchase. Subscriptions may renew automatically until canceled through the platform used to purchase them. Except where required by law or stated at purchase, payments are non-refundable. Taxes and third-party store terms may apply.</p>
          </PolicyBlock>
          <PolicyBlock title="Ending access and disclaimers">
            <p>You may stop using Flirtschat at any time. We may restrict or terminate access when these terms are violated, safety is at risk, or the law requires it. Flirtschat does not conduct every possible background check and cannot guarantee a user’s identity, intentions, compatibility, or conduct. The service is provided “as is” to the extent permitted by law.</p>
          </PolicyBlock>
          <PolicyBlock title="Liability and disputes">
            <p>To the fullest extent permitted by applicable law, Flirtschat is not liable for indirect, incidental, special, consequential, or punitive damages, or for conduct by other users. Nothing in these terms limits rights or liability that cannot legally be limited. Governing law and dispute procedures will be those applicable to your place of residence unless valid local terms state otherwise.</p>
          </PolicyBlock>
        </section>

        <section id="privacy" className="legal-section">
          <div className="legal-section-title"><span>02</span><div><p>Privacy Policy</p><h2>How we handle data</h2></div></div>
          <PolicyBlock title="Information we collect">
            <p>We collect information you provide, including account details, profile content, preferences, messages, reports, support requests, and purchase information. We may also collect device and browser data, IP address, identifiers, approximate or precise location when you grant permission, activity logs, cookie data, and information from connected services.</p>
          </PolicyBlock>
          <PolicyBlock title="How we use information">
            <p>We use information to create and secure accounts, recommend and connect people, deliver messages and paid features, personalize the experience, process transactions, prevent fraud and abuse, respond to support requests, measure and improve the service, send communications based on your settings, and meet legal obligations.</p>
          </PolicyBlock>
          <PolicyBlock title="When information is shared">
            <p>Your public profile and content you choose to share may be visible to other users. We may share data with vendors that provide hosting, payments, analytics, moderation, communications, and security; with authorities when legally required; or as part of a merger, financing, or sale. We do not sell personal information for money. Where applicable, you may opt out of sharing used for cross-context behavioral advertising.</p>
          </PolicyBlock>
          <PolicyBlock title="Retention and security">
            <p>We retain information while your account is active and as reasonably needed for safety, dispute resolution, fraud prevention, and legal compliance. Retention periods vary by data type and purpose. We use administrative, technical, and physical safeguards, but no online service can guarantee absolute security.</p>
          </PolicyBlock>
          <PolicyBlock title="Your choices and rights">
            <p>You can update profile details, notification choices, discovery preferences, location permissions, and other settings in the app. Depending on where you live, you may request access, correction, deletion, portability, restriction, or objection, and may appeal a denied request. We may need to verify your identity before fulfilling a request.</p>
          </PolicyBlock>
          <PolicyBlock title="Cookies, children, and international use">
            <p>We use cookies and similar technology for authentication, preferences, security, and analytics. Flirtschat is not intended for anyone under 18; report suspected underage use immediately. Information may be processed outside your country with safeguards required by applicable law.</p>
          </PolicyBlock>
        </section>

        <section id="safety" className="legal-section">
          <div className="legal-section-title"><span>03</span><div><p>Safety & Conduct</p><h2>Protecting the community</h2></div></div>
          <div className="legal-callout"><ShieldCheck/><div><strong>Meet thoughtfully and report concerns.</strong><p>Keep early conversations in the app, never send money, protect personal and financial details, meet in public, tell someone your plans, and arrange your own transportation. Use block and report tools for suspicious, threatening, or abusive behavior. Contact local emergency services if anyone is in immediate danger.</p></div></div>
        </section>

        <section id="contact" className="legal-contact">
          <Mail/>
          <div><p>Questions, support, or privacy requests</p><h2>We’re here to help.</h2><p>Email our support team and include enough detail for us to investigate your request. Please do not email passwords or full payment-card details.</p><a href="mailto:support@flirtschat.com">support@flirtschat.com</a></div>
        </section>

        <footer className="legal-footer"><span>© 2026 Flirtschat. Made for Gen Z</span><Link href="/settings">Back to settings</Link></footer>
      </article>
    </div>
  </main>
}

function PolicyBlock({title,children}:{title:string;children:React.ReactNode}){return <div className="legal-block"><h3>{title}</h3>{children}</div>}
