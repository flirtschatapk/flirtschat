import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getPrivateBucket,getR2Client} from "@/lib/r2/server";

const allowed=new Set(["image/jpeg","image/png","image/webp"]);
const extension:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
const maxBytes=10*1024*1024;

export async function POST(request:Request){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:{code:"UNAUTHENTICATED",message:"Sign in required"}},{status:401});
  const body=await request.json().catch(()=>null) as {contentType?:string;size?:number}|null;
  if(!body?.contentType||!allowed.has(body.contentType))return NextResponse.json({error:{code:"INVALID_IMAGE",message:"Use a JPG, PNG or WEBP image."}},{status:400});
  if(!Number.isInteger(body.size)||!body.size||body.size<1||body.size>maxBytes)return NextResponse.json({error:{code:"INVALID_IMAGE_SIZE",message:"Images must be under 10 MB."}},{status:413});
  const{data:profile,error:profileError}=await supabase.from("fc_profiles").select("id,profile_visible,onboarding_completed,suspended_until").eq("id",user.id).maybeSingle();
  const suspended=profile?.suspended_until&&new Date(profile.suspended_until)>new Date();
  if(profileError||!profile||!profile.profile_visible||!profile.onboarding_completed||suspended)return NextResponse.json({error:{code:"POSTING_UNAVAILABLE",message:"Posting is unavailable for this profile."}},{status:403});
  const objectKey=`global-post-image/${user.id}/${crypto.randomUUID()}.${extension[body.contentType]}`;
  try{
    const uploadUrl=await getSignedUrl(getR2Client(),new PutObjectCommand({Bucket:getPrivateBucket(),Key:objectKey,ContentType:body.contentType,ContentLength:body.size}),{expiresIn:300});
    return NextResponse.json({uploadUrl,objectKey,expiresIn:300});
  }catch(error){
    console.error("Global post image signing failed",{name:error instanceof Error?error.name:"UnknownError"});
    return NextResponse.json({error:{code:"UPLOAD_SIGNING_FAILED",message:"Image upload unavailable"}},{status:503});
  }
}
