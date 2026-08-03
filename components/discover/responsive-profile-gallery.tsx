"use client";

import type {ReactNode} from "react";
import type {DiscoverProfile} from "@/lib/discover-types";
import type {DiscoverAction} from "./action-buttons";
import {ProfileCard} from "./profile-card";
import {ProfileCardStack} from "./profile-card-stack";

export function ResponsiveProfileGallery({profiles,index,busy,direction,onOpen,onSwipe,renderDesktopActions}:{profiles:DiscoverProfile[];index:number;busy:boolean;direction:{x:number;y:number};onOpen:(index:number)=>void;onSwipe:(action:DiscoverAction)=>void;renderDesktopActions:(index:number)=>ReactNode}) {
  const visible = profiles.slice(index, index + 3);
  return <>
    <div className="discover-mobile-gallery">
      <ProfileCardStack profiles={profiles} index={index} busy={busy} direction={direction} onOpen={() => onOpen(index)} onSwipe={onSwipe}/>
    </div>
    <div className="discover-desktop-gallery">
      {visible.map((profile, offset) => {
        const profileIndex = index + offset;
        return <div className="discover-desktop-card-column" key={profile.id}>
          <ProfileCard profile={profile} onOpen={() => onOpen(profileIndex)}/>
          {renderDesktopActions(profileIndex)}
        </div>;
      })}
    </div>
  </>;
}
