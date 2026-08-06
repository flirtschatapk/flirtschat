import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function POST(){
  const supabase=await createClient(),{data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const{error}=await supabase.from("fc_profiles").update({last_seen_at:new Date().toISOString()}).eq("id",user.id);
  if(error){console.error("[POST /api/presence/heartbeat]",{code:error.code,message:error.message});return NextResponse.json({error:"Presence update failed"},{status:500})}
  return NextResponse.json({ok:true});
}
