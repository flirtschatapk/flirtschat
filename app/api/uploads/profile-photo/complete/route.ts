import {DeleteObjectCommand} from "@aws-sdk/client-s3";
import {NextResponse} from "next/server";
import {getPublicBucket,getR2Client} from "@/lib/r2/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:Request){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:{code:"UNAUTHENTICATED",message:"Sign in required"}},{status:401});
  const body=await request.json().catch(()=>null) as {objectKey?:string;replacePhotoId?:string}|null;
  if(!body?.objectKey||!body.objectKey.startsWith(`profiles/${user.id}/`))return NextResponse.json({error:{code:"INVALID_OBJECT_KEY",message:"Invalid upload"}},{status:400});
  if(body.replacePhotoId){
    const{data:existingPhoto,error:lookupError}=await supabase.from("fc_profile_photos").select("id,object_key").eq("id",body.replacePhotoId).eq("user_id",user.id).maybeSingle();
    if(lookupError||!existingPhoto)return NextResponse.json({error:{code:"PHOTO_NOT_FOUND",message:"Photo could not be replaced"},objectKey:body.objectKey},{status:404});
    const{data,error}=await supabase.from("fc_profile_photos").update({object_key:body.objectKey,moderation_status:"approved",reviewed_at:null}).eq("id",existingPhoto.id).eq("user_id",user.id).select("id").single();
    if(error){console.error("Profile photo replacement failed",{code:error.code});return NextResponse.json({error:{code:"PHOTO_RECORD_FAILED",message:"Photo could not be replaced"},objectKey:body.objectKey},{status:500})}
    try{await getR2Client().send(new DeleteObjectCommand({Bucket:getPublicBucket(),Key:existingPhoto.object_key}))}catch(error){console.error("Replaced profile photo cleanup failed",{name:error instanceof Error?error.name:"UnknownError"})}
    return NextResponse.json({id:data.id,status:"approved",objectKey:body.objectKey});
  }
  const{data:existing,error:listError}=await supabase.from("fc_profile_photos").select("id,position").eq("user_id",user.id).order("position");
  if(listError){console.error("Profile photo position lookup failed",{code:listError.code});return NextResponse.json({error:{code:"PHOTO_RECORD_FAILED",message:"Photo could not be saved"},objectKey:body.objectKey},{status:500})}
  const used=new Set((existing??[]).map(x=>x.position)),position=[0,1,2,3,4].find(x=>!used.has(x));if(position===undefined)return NextResponse.json({error:{code:"PHOTO_LIMIT",message:"Maximum five photos"},objectKey:body.objectKey},{status:409});
  const{data,error}=await supabase.from("fc_profile_photos").upsert({user_id:user.id,object_key:body.objectKey,position,moderation_status:"approved"},{onConflict:"object_key"}).select("id").single();
  if(error){console.error("Profile photo record insert failed",{code:error.code});return NextResponse.json({error:{code:"PHOTO_RECORD_FAILED",message:"Photo could not be saved"},objectKey:body.objectKey},{status:500})}
  return NextResponse.json({id:data.id,status:"approved",objectKey:body.objectKey});
}
