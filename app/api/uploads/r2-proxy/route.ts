import {PutObjectCommand} from "@aws-sdk/client-s3";
import {NextResponse} from "next/server";
import {getPrivateBucket,getR2Client} from "@/lib/r2/server";
import {createClient} from "@/lib/supabase/server";

const allowed=new Set(["image/jpeg","image/png","image/webp"]),keyPattern=/^(profiles|report-evidence)\/([0-9a-f-]{36})\/[0-9a-f-]{36}\.(jpg|png|webp)$/;
export async function PUT(request:Request){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:{code:"UNAUTHENTICATED",message:"Sign in required"}},{status:401});
  const key=new URL(request.url).searchParams.get("key")??"",match=key.match(keyPattern),contentType=request.headers.get("content-type")??"";
  if(!match||match[2]!==user.id||!allowed.has(contentType))return NextResponse.json({error:{code:"INVALID_UPLOAD",message:"Invalid upload"}},{status:400});
  const declared=Number(request.headers.get("content-length")||0);if(declared>5*1024*1024)return NextResponse.json({error:{code:"FILE_TOO_LARGE",message:"Invalid upload"}},{status:413});
  try{
    const body=new Uint8Array(await request.arrayBuffer());if(!body.length||body.length>5*1024*1024)return NextResponse.json({error:{code:"INVALID_SIZE",message:"Invalid upload"}},{status:400});
    await getR2Client().send(new PutObjectCommand({Bucket:getPrivateBucket(),Key:key,ContentType:contentType,ContentLength:body.length,Body:body}));
    return NextResponse.json({ok:true});
  }catch(error){console.error("R2 proxy upload failed",{name:error instanceof Error?error.name:"UnknownError"});return NextResponse.json({error:{code:"MEDIA_UPLOAD_FAILED",message:"Upload unavailable"}},{status:502})}
}
