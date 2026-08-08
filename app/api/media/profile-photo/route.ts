import {NextResponse} from "next/server";
import {getPublicR2Url} from "@/lib/r2/server";
import {createClient as createSupabaseClient} from "@/lib/supabase/server";

export async function GET(request:Request){
  const supabase=await createSupabaseClient();
  const{data:{user},error}=await supabase.auth.getUser();
  if(error||!user){if(process.env.NODE_ENV==="development")console.info("[public-profile-media] media response",{status:401});return NextResponse.json({error:"Unauthorized"},{status:401});}
  const key=new URL(request.url).searchParams.get("key")||"";
  const development=process.env.NODE_ENV==="development",deny=(status:number,error:string)=>{if(development)console.info("[public-profile-media] media response",{status});return NextResponse.json({error},{status})};
  if(!/^profiles\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key))return deny(400,"Invalid media key");
  const{data:photo,error:photoError}=await supabase.from("fc_profile_photos").select("user_id,moderation_status").eq("object_key",key).maybeSingle();
  if(photoError)return deny(500,"Photo unavailable");
  if(!photo)return deny(404,"Not found");
  const{data:publicProfile,error:profileError}=await supabase.rpc("fc_public_profile",{requested_profile:photo.user_id});
  const eligible=Array.isArray(publicProfile)&&publicProfile.some(profile=>profile.id===photo.user_id&&Array.isArray(profile.photo_keys)&&profile.photo_keys.includes(key));
  if(profileError||photo.moderation_status!=="approved"||!eligible)return deny(403,"Photo unavailable");
  if(development)console.info("[public-profile-media] eligible photo",{requestedProfileId:photo.user_id,photoCount:1,resolvedEligiblePhotoCount:1});
  if(development)console.info("[public-profile-media] media response",{status:307});
  return NextResponse.redirect(getPublicR2Url(key),307);
}
