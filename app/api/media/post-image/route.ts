import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getPrivateBucket,getR2Client} from "@/lib/r2/server";

export async function GET(request:Request){
  const supabase=await createClient(),{data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const key=new URL(request.url).searchParams.get("key")||"";
  if(!/^global-post-image\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(key))return NextResponse.json({error:"Image unavailable"},{status:400});
  const{data:post,error}=await supabase.from("fc_posts").select("id,image_key").eq("image_key",key).maybeSingle();
  if(error||!post)return NextResponse.json({error:"Image unavailable"},{status:error?500:404});
  try{
    const url=await getSignedUrl(getR2Client(),new GetObjectCommand({Bucket:getPrivateBucket(),Key:key}),{expiresIn:120});
    const response=NextResponse.redirect(url,307);
    response.headers.set("Cache-Control","private, no-store");
    return response;
  }catch(error){
    console.error("Global post image signing failed",{name:error instanceof Error?error.name:"UnknownError"});
    return NextResponse.json({error:"Image unavailable"},{status:503});
  }
}
