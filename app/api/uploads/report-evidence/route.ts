import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getPrivateBucket,getR2Client} from "@/lib/r2/server";

const allowed=new Set(["image/jpeg","image/png","image/webp"]),ext:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
export async function POST(request:Request){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:{code:"UNAUTHENTICATED",message:"Sign in required"}},{status:401});
  const body=await request.json().catch(()=>null) as {contentType?:string;size?:number}|null;
  if(!body?.contentType||!allowed.has(body.contentType)||!body.size||body.size>5*1024*1024)return NextResponse.json({error:{code:"INVALID_UPLOAD",message:"Invalid upload"}},{status:400});
  const objectKey=`report-evidence/${user.id}/${crypto.randomUUID()}.${ext[body.contentType]}`;
  try{
    const uploadUrl=await getSignedUrl(getR2Client(),new PutObjectCommand({Bucket:getPrivateBucket(),Key:objectKey,ContentType:body.contentType,ContentLength:body.size}),{expiresIn:300});
    const fallbackUrl=new URL(`/api/uploads/r2-proxy?key=${encodeURIComponent(objectKey)}`,request.url).toString();
    return NextResponse.json({uploadUrl,objectKey,fallbackUrl,expiresIn:300});
  }catch(error){console.error("Evidence upload signing failed",{name:error instanceof Error?error.name:"UnknownError"});return NextResponse.json({error:{code:"UPLOAD_SIGNING_FAILED",message:"Upload unavailable"}},{status:503})}
}
