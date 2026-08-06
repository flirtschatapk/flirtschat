import {DeleteObjectCommand} from "@aws-sdk/client-s3";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getPublicBucket,getR2Client} from "@/lib/r2/server";
import {createClient} from "@/lib/supabase/server";

const actionSchema=z.discriminatedUnion("action",[
  z.object({action:z.literal("primary"),photoId:z.string().uuid()}),
  z.object({action:z.literal("move"),photoId:z.string().uuid(),direction:z.enum(["up","down"])})
]);
const deleteSchema=z.object({photoId:z.string().uuid()});
const safeError=(status:number,message:string)=>NextResponse.json({ok:false,error:{message}},{status});

export async function PATCH(request:Request){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();
  if(!user)return safeError(401,"Unauthorized");
  const parsed=actionSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return safeError(400,"Invalid photo action.");
  const{data:photos,error}=await supabase.from("fc_profile_photos").select("id,position").eq("user_id",user.id).order("position");
  if(error){console.error("[PATCH /api/profile/photos]",{code:error.code,message:error.message});return safeError(500,"We couldn't update your photos.")}
  const index=(photos??[]).findIndex(photo=>photo.id===parsed.data.photoId);
  if(index<0)return safeError(404,"Photo not found.");
  const requested=parsed.data.action==="primary"?0:index+(parsed.data.direction==="up"?-1:1);
  const target=Math.max(0,Math.min((photos?.length??1)-1,requested));
  if(target===index)return NextResponse.json({ok:true});
  const{error:moveError}=await supabase.rpc("fc_move_own_profile_photo",{photo_id:parsed.data.photoId,new_position:target});
  if(moveError){console.error("[PATCH /api/profile/photos]",{code:moveError.code,message:moveError.message});return safeError(500,"We couldn't reorder your photos.")}
  return NextResponse.json({ok:true});
}

export async function DELETE(request:Request){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();
  if(!user)return safeError(401,"Unauthorized");
  const parsed=deleteSchema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return safeError(400,"Invalid photo.");
  const{data:photo,error:lookupError}=await supabase.from("fc_profile_photos").select("id,object_key").eq("id",parsed.data.photoId).eq("user_id",user.id).maybeSingle();
  if(lookupError){console.error("[DELETE /api/profile/photos]",{code:lookupError.code,message:lookupError.message});return safeError(500,"We couldn't delete your photo.")}
  if(!photo)return safeError(404,"Photo not found.");
  const{error}=await supabase.from("fc_profile_photos").delete().eq("id",photo.id).eq("user_id",user.id);
  if(error){console.error("[DELETE /api/profile/photos]",{code:error.code,message:error.message});return safeError(500,"We couldn't delete your photo.")}
  try{await getR2Client().send(new DeleteObjectCommand({Bucket:getPublicBucket(),Key:photo.object_key}))}catch(error){console.error("[DELETE /api/profile/photos] R2 cleanup",{name:error instanceof Error?error.name:"UnknownError"})}
  return NextResponse.json({ok:true});
}
