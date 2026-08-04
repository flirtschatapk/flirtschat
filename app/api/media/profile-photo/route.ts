import {NextResponse} from "next/server";
import {getPublicR2Url} from "@/lib/r2/server";
import {createClient as createSupabaseClient} from "@/lib/supabase/server";

export async function GET(request:Request){
  const supabase=await createSupabaseClient();
  const{data:{user},error}=await supabase.auth.getUser();
  if(error||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const key=new URL(request.url).searchParams.get("key")||"";
  if(!/^profiles\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key))return NextResponse.json({error:"Invalid media key"},{status:400});
  const{data:photo}=await supabase.from("fc_profile_photos").select("user_id,moderation_status").eq("object_key",key).maybeSingle();
  if(!photo)return NextResponse.json({error:"Not found"},{status:404});
  if(photo.user_id!==user.id&&photo.moderation_status!=="approved")return NextResponse.json({error:"Photo unavailable"},{status:403});
  if(photo.user_id!==user.id){const{data:blocked}=await supabase.rpc("fc_users_blocked",{a:user.id,b:photo.user_id});if(blocked)return NextResponse.json({error:"Photo unavailable"},{status:403})}
  return NextResponse.redirect(getPublicR2Url(key),307);
}
