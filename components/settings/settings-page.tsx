"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  CreditCard,
  Crown,
  EyeOff,
  FileText,
  Globe2,
  Languages,
  KeyRound,
  LockKeyhole,
  LoaderCircle,
  LogOut,
  Mail,
  MailCheck,
  Moon,
  Palette,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Settings,
  Wifi,
  X,
  UserRound,
  UserRoundX,
} from "lucide-react";
import {useEffect,useState,type ReactNode} from "react";
import {AppBottomNav} from "@/components/app-bottom-nav";
import {ProfileImage} from "@/components/profile-image";
import {isPremiumUser} from "@/lib/discover-entitlements";
import {EMAIL_UPDATES_EVENT,EMAIL_UPDATES_KEY,loadEmailUpdatePreferences,saveEmailUpdatePreferences,setEmailUpdatesEnabled,type EmailUpdateCategory,type EmailUpdatePreferences} from "@/lib/email-update-service";
import {disablePushNotifications,enablePushNotifications,getPushPermission,loadPushEnabled,PUSH_CHANGE_EVENT,showTestPush,type PushPermission} from "@/lib/push-notification-service";

type Accent="pink"|"violet"|"blue"|"cyan"|"green"|"gold"|"red";

export function SettingsPage(){
  const router=useRouter();
  const [push,setPush]=useState(false);
  const [pushPermission,setPushPermission]=useState<PushPermission>("default");
  const [pushBusy,setPushBusy]=useState(false);
  const [featureNotice,setFeatureNotice]=useState("");
  const [email,setEmail]=useState(true);
  const [emailPreferences,setEmailPreferences]=useState<EmailUpdatePreferences|null>(null);
  const [emailBusy,setEmailBusy]=useState(false);
  const [emailPanel,setEmailPanel]=useState(false);
  const [online,setOnline]=useState(true);
  const [incognito,setIncognito]=useState(false);
  const [premium,setPremium]=useState(false);

  useEffect(()=>{
    try{
      const saved=localStorage.getItem("flirtschat-settings");
      if(saved){const value=JSON.parse(saved) as {push?:boolean;email?:boolean;online?:boolean;incognito?:boolean};setPush(value.push??true);setEmail(value.email??true);setOnline(value.online??true);setIncognito(value.incognito??false)}
    }catch{}
    const syncPremium=()=>{const active=isPremiumUser();setPremium(active);if(!active){setOnline(true);try{const saved=JSON.parse(localStorage.getItem("flirtschat-settings")??"{}") as Record<string,unknown>;localStorage.setItem("flirtschat-settings",JSON.stringify({...saved,online:true}))}catch{}}};
    const syncPush=()=>{setPushPermission(getPushPermission());setPush(loadPushEnabled())};
    const syncEmail=()=>{const preferences=loadEmailUpdatePreferences();setEmailPreferences(preferences);setEmail(preferences.enabled)};
    syncPremium();
    syncPush();
    syncEmail();
    window.addEventListener("flirtschat:premium-change",syncPremium);
    window.addEventListener(PUSH_CHANGE_EVENT,syncPush);
    window.addEventListener(EMAIL_UPDATES_EVENT,syncEmail);
    const syncStorage=(event:StorageEvent)=>{if(event.key==="flirtschat:push-enabled")syncPush();if(event.key===EMAIL_UPDATES_KEY)syncEmail();if(event.key==="flirtschat-settings"){try{const saved=JSON.parse(event.newValue??"{}") as {online?:boolean};setOnline(isPremiumUser()?saved.online??true:true)}catch{setOnline(true)}}};
    window.addEventListener("storage",syncStorage);
    return()=>{window.removeEventListener("flirtschat:premium-change",syncPremium);window.removeEventListener(PUSH_CHANGE_EVENT,syncPush);window.removeEventListener(EMAIL_UPDATES_EVENT,syncEmail);window.removeEventListener("storage",syncStorage)};
  },[]);

  const update=(key:"push"|"email"|"online"|"incognito",value:boolean)=>{
    const next={push,email,online,incognito,[key]:value};
    if(key==="push")setPush(value);if(key==="email")setEmail(value);if(key==="online")setOnline(value);if(key==="incognito")setIncognito(value);
    try{localStorage.setItem("flirtschat-settings",JSON.stringify(next))}catch{}
  };

  const changePush=async(value:boolean)=>{if(pushBusy)return;setPushBusy(true);setFeatureNotice("");try{if(value){await enablePushNotifications();setPush(true);setPushPermission("granted");update("push",true);setFeatureNotice("Push notifications enabled. A test notification was sent.")}else{disablePushNotifications();setPush(false);update("push",false);setFeatureNotice("Push notifications turned off.")}setTimeout(()=>setFeatureNotice(""),3500)}catch(reason){setPush(false);setPushPermission(getPushPermission());update("push",false);setFeatureNotice(reason instanceof Error?reason.message:"Could not update notifications");setTimeout(()=>setFeatureNotice(""),4500)}finally{setPushBusy(false)}};
  const testPush=()=>{try{showTestPush();setFeatureNotice("Test notification sent.")}catch(reason){setFeatureNotice(reason instanceof Error?reason.message:"Could not send notification")}setTimeout(()=>setFeatureNotice(""),3000)};
  const changeOnline=(value:boolean)=>{if(!premium&&!value){setFeatureNotice("Offline mode is a Premium feature.");setTimeout(()=>router.push("/premium"),450);return}setOnline(value);update("online",value);window.dispatchEvent(new CustomEvent("flirtschat:online-status-change",{detail:{online:value}}));setFeatureNotice(value?"Your profile is now online.":"You are now browsing offline.");setTimeout(()=>setFeatureNotice(""),3000)};
  const changeEmailUpdates=async(value:boolean)=>{if(emailBusy)return;setEmailBusy(true);try{const preferences=await setEmailUpdatesEnabled(value);setEmailPreferences(preferences);setEmail(value);update("email",value);setFeatureNotice(value?"Email updates subscribed.":"Email updates unsubscribed.");setTimeout(()=>setFeatureNotice(""),3000)}finally{setEmailBusy(false)}};
  const updateEmailPreferences=async(next:EmailUpdatePreferences)=>{setEmailPreferences(next);try{setEmailPreferences(await saveEmailUpdatePreferences(next))}catch{setFeatureNotice("Could not save email preferences.")}};

  return <main className="settings-page">
    <header className="settings-topbar">
      <div><h1>Settings</h1><p>Manage your account, privacy and preferences <span>♥</span></p></div>
      <Link className="settings-bell settings-header-gear metallic-setting-icon violet" href="/settings" aria-label="Settings"><Settings/></Link>
    </header>

    <div className="settings-content">
      <section className="settings-profile-card">
        <span className="settings-profile-photo"><ProfileImage position="0% 0%"/><i/></span>
        <span className="settings-profile-copy"><strong>Alexandra <ShieldCheck/></strong><small>@alexandra_98</small><em><Sparkles/> Premium</em><time>Active since August 20, 2026</time></span>
        <Link href="/profile" className="settings-profile-button"><i className="settings-profile-button-icon"><UserRound/></i><span>View Profile</span><ChevronRight className="settings-profile-button-arrow"/></Link>
      </section>

      <SettingsGroup title="Account">
        <SettingLink icon={<UserRound/>} accent="pink" label="Account Information" text="Update your personal details" href="/profile"/>
        <SettingLink icon={<Mail/>} accent="violet" label="Email & Phone" text="Manage your email and phone number" href="/settings/email-phone"/>
        <SettingLink icon={<LockKeyhole/>} accent="blue" label="Password" text="Change your password" href="/settings/password"/>
        <SettingLink icon={<KeyRound/>} accent="red" label="Login & Security" text="Manage login, devices and security" href="/settings/security"/>
        <SettingLink icon={<CreditCard/>} accent="gold" label="Premium & Billing" text="Manage your subscription" href="/premium"/>
      </SettingsGroup>

      <SettingsGroup title="Preferences">
        <SettingLocked icon={<Moon/>} accent="violet" label="Dark Mode" text="Always on for the Flirtschat experience"/>
        <PushNotificationSetting value={push} permission={pushPermission} busy={pushBusy} onChange={changePush} onTest={testPush}/>
        <OnlineStatusSetting value={premium?online:true} premium={premium} onChange={changeOnline}/>
        <EmailUpdatesSetting value={email} preferences={emailPreferences} busy={emailBusy} onChange={changeEmailUpdates} onManage={()=>setEmailPanel(true)}/>
        <PremiumSettingToggle icon={<EyeOff/>} label="Incognito Mode" text="Browse profiles without being seen" value={incognito} premium={premium} onChange={value=>update("incognito",value)} onUpgrade={()=>router.push("/premium")}/>
        <SettingLink icon={<SlidersHorizontal/>} accent="violet" label="Discovery Preferences" text="Manage who you see in discovery" href="/settings/discovery"/>
        <LanguageSettingLink/>
      </SettingsGroup>

      <SettingsGroup title="Privacy & Safety">
        <SettingLink icon={<ShieldCheck/>} accent="green" label="Privacy Settings" text="Control who can see you" href="/settings/privacy"/>
        <SettingLink icon={<UserRoundX/>} accent="red" label="Blocked Users" text="Manage blocked accounts" href="/settings/blocked"/>
        <SettingLink icon={<Palette/>} accent="gold" label="Safety Center" text="Tips and tools to keep you safe" href="/settings/safety"/>
        <SettingLink icon={<FileText/>} accent="violet" label="Terms & Policies" text="Terms of service and privacy policy" href="/privacy"/>
      </SettingsGroup>

      <SettingsGroup title="Support">
        <SettingLink icon={<CircleHelp/>} accent="blue" label="Help Center" text="Find help and contact support" href="/help"/>
        <SettingLink icon={<Phone/>} accent="green" label="Contact Us" text="We're here to help" href="/contact"/>
        <SettingLink icon={<Globe2/>} accent="violet" label="About Flirtschat" text="FLIRTSCHAT · Gen Z Dating App" href="/about"/>
      </SettingsGroup>

      <Link className="settings-logout" href="/auth/logout"><i className="settings-logout-metal"><LogOut/></i><span>Log Out</span></Link>
      <p className="settings-version">Flirtschat 1.0.0 · Made with ♥</p>
    </div>
    <AppBottomNav active="settings"/>
    {featureNotice&&<div className="settings-feature-toast" role="status"><Bell/>{featureNotice}</div>}
    {emailPanel&&emailPreferences&&<div className="settings-email-backdrop" role="dialog" aria-modal="true" aria-labelledby="email-updates-title" onClick={()=>setEmailPanel(false)}><section className="settings-email-panel" onClick={event=>event.stopPropagation()}><header><div><small>Email preferences</small><h2 id="email-updates-title">Choose your updates</h2></div><button onClick={()=>setEmailPanel(false)} aria-label="Close email preferences"><X/></button></header><div className="settings-email-categories">{([['matches','New matches','People who match your vibe'],['messages','Messages','Unread conversations and replies'],['safety','Security alerts','Login and account protection'],['product','Product news','New Flirtschat features'],['digest','Weekly digest','Your weekly profile activity']] as [EmailUpdateCategory,string,string][]).map(([id,label,detail])=><label key={id}><span><strong>{label}</strong><small>{detail}</small></span><input type="checkbox" checked={emailPreferences.categories[id]} onChange={event=>void updateEmailPreferences({...emailPreferences,categories:{...emailPreferences.categories,[id]:event.target.checked}})}/><b className="settings-switch"/></label>)}</div><label className="settings-email-frequency"><span>Delivery frequency</span><select value={emailPreferences.frequency} onChange={event=>void updateEmailPreferences({...emailPreferences,frequency:event.target.value as EmailUpdatePreferences['frequency']})}><option value="instant">Instant</option><option value="daily">Daily summary</option><option value="weekly">Weekly summary</option></select></label><button className="settings-email-done" onClick={()=>setEmailPanel(false)}><MailCheck/>Save preferences</button></section></div>}
  </main>
}

function SettingsGroup({title,children}:{title:string;children:ReactNode}){return <section className="settings-section"><h2>{title}</h2><div className="settings-group">{children}</div></section>}

function MetallicIcon({children,accent}:{children:ReactNode;accent:Accent}){return <i className={`metallic-setting-icon ${accent}`}>{children}</i>}

function PushNotificationSetting({value,permission,busy,onChange,onTest}:{value:boolean;permission:PushPermission;busy:boolean;onChange:(value:boolean)=>void;onTest:()=>void}){const detail=permission==="unsupported"?"Not supported by this browser":permission==="denied"?"Blocked in browser settings":value?"Browser push is active":"Receive matches, messages and security alerts";return <div className="settings-row settings-push-row"><MetallicIcon accent="pink">{busy?<LoaderCircle className="spin"/>:<Bell/>}</MetallicIcon><span><strong>Push Notifications{value&&<em>Active</em>}</strong><small>{detail}</small>{value&&<button type="button" onClick={onTest}>Send test</button>}</span><label className="settings-push-toggle"><input type="checkbox" checked={value} disabled={busy||permission==="unsupported"} onChange={event=>onChange(event.target.checked)} aria-label="Push Notifications"/><b className="settings-switch"/></label></div>}

function OnlineStatusSetting({value,premium,onChange}:{value:boolean;premium:boolean;onChange:(value:boolean)=>void}){return <div className="settings-row settings-online-row"><MetallicIcon accent="green"><Wifi/></MetallicIcon><span><strong>Online Status{!premium&&<em><Crown/>PRO</em>}</strong><small>{premium?value?"People can see when you're online":"Your online status is hidden":"Only Premium members can turn this off"}</small></span><label className="settings-online-toggle"><input type="checkbox" checked={value} onChange={event=>onChange(event.target.checked)} aria-label="Online Status"/><b className="settings-switch"/></label></div>}

function EmailUpdatesSetting({value,preferences,busy,onChange,onManage}:{value:boolean;preferences:EmailUpdatePreferences|null;busy:boolean;onChange:(value:boolean)=>void;onManage:()=>void}){const selected=preferences?Object.values(preferences.categories).filter(Boolean).length:0;return <div className="settings-row settings-email-row"><MetallicIcon accent="cyan">{busy?<LoaderCircle className="spin"/>:<MailCheck/>}</MetallicIcon><span><strong>Email Updates{value&&<em>Subscribed</em>}</strong><small>{value?`${selected} update types · ${preferences?.frequency??"daily"} delivery`:"Email updates are off"}</small>{value&&<button type="button" onClick={onManage}>Manage preferences</button>}</span><label className="settings-email-toggle"><input type="checkbox" checked={value} disabled={busy} onChange={event=>onChange(event.target.checked)} aria-label="Email Updates"/><b className="settings-switch"/></label></div>}

function SettingLocked({icon,accent,label,text}:{icon:ReactNode;accent:Accent;label:string;text:string}){return <div className="settings-row settings-locked-row"><MetallicIcon accent={accent}>{icon}</MetallicIcon><span><strong>{label}<em>Always on</em></strong><small>{text}</small></span><b className="settings-switch checked" aria-label={`${label} always on`}/></div>}

function PremiumSettingToggle({icon,label,text,value,premium,onChange,onUpgrade}:{icon:ReactNode;label:string;text:string;value:boolean;premium:boolean;onChange:(value:boolean)=>void;onUpgrade:()=>void}){if(!premium)return <button className="settings-row settings-premium-row" type="button" onClick={onUpgrade}><MetallicIcon accent="gold">{icon}</MetallicIcon><span><strong>{label}<em><Crown/>PRO</em></strong><small>{text}</small></span><ChevronRight className="settings-chevron"/></button>;return <label className="settings-row settings-premium-row"><MetallicIcon accent="gold">{icon}</MetallicIcon><span><strong>{label}<em><Crown/>PRO</em></strong><small>{text}</small></span><input type="checkbox" checked={value} onChange={event=>onChange(event.target.checked)} aria-label={label}/><b className="settings-switch gold"/></label>}

function SettingLink({icon,accent,label,text,href}:{icon:ReactNode;accent:Accent;label:string;text:string;href:string}){return <Link className="settings-row" href={href}><MetallicIcon accent={accent}>{icon}</MetallicIcon><span><strong>{label}</strong><small>{text}</small></span><ChevronRight className="settings-chevron"/></Link>}

function LanguageSettingLink(){const [label,setLabel]=useState("English");useEffect(()=>{const sync=()=>{try{const saved=JSON.parse(localStorage.getItem("flirtschat-language")??"null") as {label?:string}|null;setLabel(saved?.label??"English")}catch{setLabel("English")}};sync();window.addEventListener("flirtschat:language-change",sync);window.addEventListener("storage",sync);return()=>{window.removeEventListener("flirtschat:language-change",sync);window.removeEventListener("storage",sync)}},[]);return <SettingLink icon={<Languages/>} accent="blue" label="Language" text={label} href="/settings/language"/>}
