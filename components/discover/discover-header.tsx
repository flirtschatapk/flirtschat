"use client";
import {Bell,Crown} from "lucide-react";
/* eslint-disable @next/next/no-html-link-for-pages */
import {ProfileImage} from "@/components/profile-image";
import {useCurrentProfile} from "@/components/profile/current-profile-provider";
import {NotificationBadge} from "@/components/notifications/notification-badge";

export function DiscoverHeader(){const{profile,user}=useCurrentProfile();const metadata=user?.user_metadata;const avatar=profile?.primaryPhotoUrl||profile?.primaryPhotoKey||(typeof metadata?.avatar_url==="string"?metadata.avatar_url:null)||(typeof metadata?.picture==="string"?metadata.picture:null);const name=profile?.displayName||(typeof metadata?.full_name==="string"?metadata.full_name:null)||(typeof metadata?.name==="string"?metadata.name:null)||"Your profile";return <header className="discover-header discover-modern-header discover-actions-header"><a className="discover-auth-brand" href="/discover" aria-label="Flirtschat Swipe"><strong>FLIRTSCHAT</strong></a><div><a className="discover-icon premium discover-metallic-action" href="/premium" aria-label="Subscribe to Premium"><Crown/></a><a className="discover-icon discover-metallic-action discover-notification-action" href="/notifications" aria-label="Notifications"><Bell/><NotificationBadge/></a><a className="discover-icon discover-profile-icon discover-profile-photo" href="/profile" aria-label="Open profile"><ProfileImage src={avatar} alt={name}/></a></div></header>}
