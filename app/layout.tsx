import type {Metadata,Viewport} from "next";
import {CookieConsent} from "@/components/cookie-consent";
import {LanguageInitializer} from "@/components/language-initializer";
import {SplashScreen} from "@/components/splash-screen";
import {CurrentProfileProvider} from "@/components/profile/current-profile-provider";
import {PresenceProvider} from "@/components/presence/presence-provider";
import {AuthSessionManager} from "@/components/auth/auth-session-manager";
import {NotificationProvider} from "@/components/notifications/notification-provider";
import "./globals.css";
import "./notifications-premium.css";
import "./splash.css";
import "./community-features.css";
import "./admin-live.css";

export const viewport:Viewport={
  width:"device-width",
  initialScale:1,
  maximumScale:5,
  viewportFit:"cover",
  themeColor:"#000000",
  colorScheme:"dark",
};

export const metadata:Metadata={
  metadataBase:new URL("https://flirtschat.example"),
  applicationName:"FLIRTSCHAT",
  title:{default:"FLIRTSCHAT-Gen Z Dating App",template:"%s | FLIRTSCHAT"},
  description:"FLIRTSCHAT is a modern Gen Z dating app built for authentic connections, shared energy, and better conversations.",
  keywords:["FLIRTSCHAT","dating app","Gen Z dating","meet people","safe dating"],
  category:"social networking",
  openGraph:{
    title:"FLIRTSCHAT-Gen Z Dating App",
    description:"Meet authentic people, find your vibe, and start better conversations with FLIRTSCHAT.",
    url:"https://flirtschat.example",
    siteName:"FLIRTSCHAT",
    type:"website",
  },
  twitter:{
    card:"summary_large_image",
    title:"FLIRTSCHAT-Gen Z Dating App",
    description:"Meet authentic people, find your vibe, and start better conversations with FLIRTSCHAT.",
  },
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en" data-flirtschat-theme="dark"><body><CurrentProfileProvider><NotificationProvider><PresenceProvider><AuthSessionManager/><LanguageInitializer/><SplashScreen/>{children}<CookieConsent/></PresenceProvider></NotificationProvider></CurrentProfileProvider></body></html>;
}
