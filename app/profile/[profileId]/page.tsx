import {notFound} from "next/navigation";
import {RealtimePublicProfile} from "@/components/profile/realtime-public-profile";
import type {GlobalProfile} from "@/lib/global-profiles";
import {createClient} from "@/lib/supabase/server";
import {profileDetailsFromProfile} from "@/lib/profile-details";

type Row={id:string;username:string|null;display_name:string;bio:string;date_of_birth:string|null;city:string|null;country:string|null;interests:string[];relationship_goal:string|null;languages:string[];occupation:string|null;education:string|null;height_cm:number|null;zodiac:string|null;exercise:string|null;drinking:string|null;smoking:string|null;pronouns:string|null;children:string|null;beliefs:string|null;verified:boolean;premium:boolean;last_seen_at:string;created_at:string;photo_keys:string[]};
export const dynamic="force-dynamic";
const mediaUrl=(key:string)=>`/api/media/profile-photo?key=${encodeURIComponent(key)}`;
export default async function ProfilePage({params}:{params:Promise<{profileId:string}>}){
  const{profileId}=await params,supabase=await createClient();
  await supabase.rpc("fc_record_profile_visit",{viewed:profileId});
  const{data,error}=await supabase.rpc("fc_public_profile",{requested_profile:profileId});
  if(error)notFound();
  const p=(data as Row[]|null)?.find(row=>row.id===profileId);
  if(!p)notFound();
  const photoUrls=(p.photo_keys??[]).slice(0,5).map(mediaUrl);
  if(process.env.NODE_ENV==="development")console.info("[public-profile] photo resolution",{requestedProfileId:profileId,photoCount:(p.photo_keys??[]).length,resolvedEligiblePhotoCount:photoUrls.length});
  const profile:GlobalProfile={id:p.id,name:p.display_name||p.username||"Flirtschat member",age:p.date_of_birth?Math.max(18,Math.floor((Date.now()-new Date(p.date_of_birth).getTime())/31557600000)):18,place:[p.city,p.country].filter(Boolean).join(", "),position:"50% 50%",tag:"Flirtschat",likes:0,verified:p.verified,premium:p.premium,isNew:Date.now()-new Date(p.created_at).getTime()<604800000,online:Date.now()-new Date(p.last_seen_at).getTime()<300000,size:"tall",bio:p.bio||"",interests:p.interests||[],goal:p.relationship_goal||"Still exploring",languages:p.languages||[],photoUrl:photoUrls[0]??null,photoUrls,profileDetails:profileDetailsFromProfile({occupation:p.occupation||"",education:p.education||"",heightCm:p.height_cm,zodiac:p.zodiac||"",exercise:p.exercise||"",drinking:p.drinking||"",smoking:p.smoking||"",pronouns:p.pronouns||"",children:p.children||"",beliefs:p.beliefs||""})};
  return <RealtimePublicProfile profile={profile} lastSeen={p.last_seen_at}/>;
}
