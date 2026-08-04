import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {NextResponse} from "next/server";
import {createClient as createSupabaseClient} from "@/lib/supabase/server";
import {getPrivateBucket,getR2Client} from "@/lib/r2/server";

const allowed=new Set(["image/jpeg","image/png","image/webp"]);
const extensions:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};

export async function POST(request:Request){
  const supabase=await createSupabaseClient();
  const{data:{user},error}=await supabase.auth.getUser();
  if(error||!user)return NextResponse.json({error:"Unauthorized"},{status:401});

  const body=await request.json().catch(()=>null) as {contentType?:string;size?:number}|null;
  if(!body?.contentType||!allowed.has(body.contentType))return NextResponse.json({error:"JPG, PNG or WEBP required"},{status:400});
  if(!body.size||body.size>5*1024*1024)return NextResponse.json({error:"Invalid upload size"},{status:400});

  const objectKey=`profiles/${user.id}/${crypto.randomUUID()}.${extensions[body.contentType]}`;
  try{
    const command=new PutObjectCommand({Bucket:getPrivateBucket(),Key:objectKey,ContentType:body.contentType,ContentLength:body.size});
    const uploadUrl=await getSignedUrl(getR2Client(),command,{expiresIn:300});
    const mediaUrl=new URL(`/api/media/profile-photo?key=${encodeURIComponent(objectKey)}`,request.url).toString();
    const fallbackUrl=new URL(`/api/uploads/r2-proxy?key=${encodeURIComponent(objectKey)}`,request.url).toString();
    return NextResponse.json({uploadUrl,objectKey,publicUrl:mediaUrl,fallbackUrl,expiresIn:300});
  }catch(error){console.error("Profile upload signing failed",{name:error instanceof Error?error.name:"UnknownError"});return NextResponse.json({error:{code:"UPLOAD_SIGNING_FAILED",message:"Upload unavailable"}},{status:503})}
}
