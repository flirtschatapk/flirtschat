import {notFound} from "next/navigation";
import {PublicProfile} from "@/components/profile/public-profile";
import type {GlobalProfile} from "@/lib/global-profiles";
import {createClient} from "@/lib/supabase/server";

type Row={id:string;display_name:string;bio:string;date_of_birth:string|null;city:string|null;country:string|null;interests:string[];relationship_goal:string|null;languages:string[];verified:boolean;premium:boolean;last_seen_at:string;created_at:string;photo_keys:string[]};
export const dynamic="force-dynamic";
export default async function ProfilePage({params}:{params:Promise<{profileId:string}>}){
  const{profileId}=await params,supabase=await createClient();
  await supabase.rpc("fc_record_profile_visit",{viewed:profileId});
  const{data,error}=await supabase.rpc("fc_discover_profiles");
  if(error)notFound();
  const p=(data as Row[]|null)?.find(row=>row.id===profileId);
  if(!p)notFound();
  const photoUrl=p.photo_keys?.[0]?`/api/media/profile-photo?key=${encodeURIComponent(p.photo_keys[0])}`:null;
  const profile:GlobalProfile={id:p.id,name:p.display_name||"Flirtschat member",age:p.date_of_birth?Math.max(18,Math.floor((Date.now()-new Date(p.date_of_birth).getTime())/31557600000)):18,place:[p.city,p.country].filter(Boolean).join(", "),position:photoUrl??"0% 0%",tag:"Flirtschat",likes:0,verified:p.verified,premium:p.premium,isNew:Date.now()-new Date(p.created_at).getTime()<604800000,online:Date.now()-new Date(p.last_seen_at).getTime()<300000,size:"tall",bio:p.bio||"",interests:p.interests||[],goal:p.relationship_goal||"Still exploring",languages:p.languages||[],photoUrl};
  return <PublicProfile profile={profile}/>;
}
