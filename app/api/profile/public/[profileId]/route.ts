import {NextResponse} from "next/server";
import type {GlobalProfile} from "@/lib/global-profiles";
import {profileDetailsFromProfile} from "@/lib/profile-details";
import {createClient} from "@/lib/supabase/server";

type Row={id:string;username:string|null;display_name:string;bio:string;date_of_birth:string|null;city:string|null;country:string|null;interests:string[];relationship_goal:string|null;languages:string[];occupation:string|null;education:string|null;height_cm:number|null;zodiac:string|null;exercise:string|null;drinking:string|null;smoking:string|null;pronouns:string|null;children:string|null;beliefs:string|null;verified:boolean;premium:boolean;last_seen_at:string;created_at:string;photo_keys:string[]};
const mediaUrl=(key:string)=>`/api/media/profile-photo?key=${encodeURIComponent(key)}`;

export async function GET(_request:Request,{params}:{params:Promise<{profileId:string}>}){
  const{profileId}=await params,supabase=await createClient();
  const{data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({code:"UNAUTHENTICATED"},{status:401});
  await supabase.rpc("fc_record_profile_visit",{viewed:profileId});
  const{data,error}=await supabase.rpc("fc_public_profile",{requested_profile:profileId});
  if(error)return NextResponse.json({code:"PROFILE_UNAVAILABLE"},{status:404});
  const p=(data as Row[]|null)?.find(row=>row.id===profileId);
  if(!p)return NextResponse.json({code:"PROFILE_UNAVAILABLE"},{status:404});
  const photoUrls=(p.photo_keys??[]).slice(0,5).map(mediaUrl);
  const profile:GlobalProfile={id:p.id,name:p.display_name||p.username||"Flirtschat member",age:p.date_of_birth?Math.max(18,Math.floor((Date.now()-new Date(p.date_of_birth).getTime())/31557600000)):18,place:[p.city,p.country].filter(Boolean).join(", "),position:"50% 50%",tag:"Flirtschat",likes:0,verified:p.verified,premium:p.premium,isNew:Date.now()-new Date(p.created_at).getTime()<604800000,online:Date.now()-new Date(p.last_seen_at).getTime()<300000,size:"tall",bio:p.bio||"",interests:p.interests||[],goal:p.relationship_goal||"Still exploring",languages:p.languages||[],photoUrl:photoUrls[0]??null,photoUrls,profileDetails:profileDetailsFromProfile({occupation:p.occupation||"",education:p.education||"",heightCm:p.height_cm,zodiac:p.zodiac||"",exercise:p.exercise||"",drinking:p.drinking||"",smoking:p.smoking||"",pronouns:p.pronouns||"",children:p.children||"",beliefs:p.beliefs||""})};
  return NextResponse.json({profile,lastSeen:p.last_seen_at});
}
