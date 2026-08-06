import {BadgeCheck, Crown, MapPin} from "lucide-react";
import {ProfileImage} from "@/components/profile-image";
import {usePresence} from "@/components/presence/presence-provider";
import type {DiscoverProfile} from "@/lib/discover-types";

export function ProfileCard({profile, photo = 0, onOpen}: {profile: DiscoverProfile; photo?: number; onOpen: () => void}) {
  const presence=usePresence(profile.id,profile.lastSeen);
  const photoValue=profile.photos[photo]??null,isUrl=Boolean(photoValue&&(photoValue.startsWith("/")||photoValue.startsWith("https://")));const [horizontal = "50%", vertical = "0%"] = photoValue?.split(" ")??[];
  const faceCenteredPosition = `${horizontal} ${vertical === "100%" ? "84%" : "-14%"}`;
  return <button className="discover-profile-card reference-card discover-card-v2 reference-match-card swipe-global-card" onClick={onOpen} aria-label={`Open ${profile.name}'s full profile`}>
    <ProfileImage position={isUrl?"50% 50%":faceCenteredPosition} src={isUrl?photoValue:null} className="face-centered-profile"/>
    <div className="discover-card-shade"/>
    {profile.isNew && <span className="global-new-badge">NEW</span>}
    <span className={`global-card-presence ${presence.online ? "online" : "offline"}`} aria-label={presence.online ? "Online now" : presence.label}/>
    {profile.premium && <span className="global-premium-crown" aria-label="Premium member"><Crown/></span>}
    <div className="discover-card-copy">
      <div className="discover-name">
        <h1>{profile.name}, {profile.age}</h1>
        {profile.verified && <BadgeCheck aria-label="Verified profile"/>}
      </div>
      {profile.username&&<small className="discover-handle">@{profile.username}</small>}
      <p className="discover-location"><MapPin/>{profile.city}, {profile.country}</p>
      <div className="match-card-footer">
        <div className="discover-photo-dots" aria-label={`Photo ${photo + 1} of ${profile.photos.length}`}>
          {profile.photos.map((_, index) => <i className={index === photo ? "active" : ""} key={index}/>)}
        </div>
        <span>{profile.photos.length?`${photo+1} / ${profile.photos.length}`:"No photo"}</span>
      </div>
    </div>
  </button>;
}
