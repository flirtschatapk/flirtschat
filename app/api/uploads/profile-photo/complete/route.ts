import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:Request){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:{code:"UNAUTHENTICATED",message:"Sign in required"}},{status:401});
  const body=await request.json().catch(()=>null) as {objectKey?:string}|null;
  if(!body?.objectKey||!body.objectKey.startsWith(`profiles/${user.id}/`))return NextResponse.json({error:{code:"INVALID_OBJECT_KEY",message:"Invalid upload"}},{status:400});
  const{data:existing,error:listError}=await supabase.from("fc_profile_photos").select("id,position").eq("user_id",user.id).order("position");
  if(listError){console.error("Profile photo position lookup failed",{code:listError.code});return NextResponse.json({error:{code:"PHOTO_RECORD_FAILED",message:"Photo could not be saved"},objectKey:body.objectKey},{status:500})}
  const used=new Set((existing??[]).map(x=>x.position)),position=[0,1,2,3,4,5].find(x=>!used.has(x));if(position===undefined)return NextResponse.json({error:{code:"PHOTO_LIMIT",message:"Maximum six photos"},objectKey:body.objectKey},{status:409});
  const{data,error}=await supabase.from("fc_profile_photos").insert({user_id:user.id,object_key:body.objectKey,position,moderation_status:"pending"}).select("id").single();
  if(error){console.error("Profile photo record insert failed",{code:error.code});return NextResponse.json({error:{code:"PHOTO_RECORD_FAILED",message:"Photo could not be saved"},objectKey:body.objectKey},{status:500})}
  return NextResponse.json({id:data.id,status:"pending",objectKey:body.objectKey});
}
