import {Bell,Crown} from "lucide-react";
import {ProfileImage} from "@/components/profile-image";

export function DiscoverHeader(){return <header className="discover-header discover-modern-header discover-actions-header"><a className="discover-auth-brand" href="/discover" aria-label="Flirtschat Swipe"><strong>FLIRTSCHAT</strong></a><div><a className="discover-icon premium discover-metallic-action" href="/premium" aria-label="Subscribe to Premium"><Crown/></a><a className="discover-icon discover-metallic-action discover-notification-action" href="/notifications" aria-label="Notifications"><Bell/><i/></a><a className="discover-icon discover-profile-icon discover-profile-photo" href="/onboarding" aria-label="Open profile"><ProfileImage position="0% 0%"/></a></div></header>}
