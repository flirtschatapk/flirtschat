import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getPrivateBucket,getR2Client} from "@/lib/r2/server";

const allowed=new Set(["video/mp4","video/webm","video/quicktime"]);
const extensions:Record<string,string>={"video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"};
const maxBytes=50*1024*1024;

export async function POST(request:Request){
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:{code:"UNAUTHENTICATED",message:"Sign in required"}},{status:401});
  const body=await request.json().catch(()=>null) as {conversationId?:string;contentType?:string;size?:number}|null;
  if(!body?.conversationId||!body.contentType||!allowed.has(body.contentType))return NextResponse.json({error:{code:"INVALID_VIDEO",message:"Unsupported video format"}},{status:400});
  if(typeof body.size!=="number"||!Number.isInteger(body.size)||body.size<1||body.size>maxBytes)return NextResponse.json({error:{code:"INVALID_VIDEO_SIZE",message:"Video is too large"}},{status:413});
  const{data:membership,error}=await supabase.from("fc_conversation_members").select("conversation_id").eq("conversation_id",body.conversationId).eq("user_id",user.id).maybeSingle();
  if(error||!membership)return NextResponse.json({error:{code:"NOT_CONVERSATION_MEMBER",message:"Conversation unavailable"}},{status:403});
  const objectKey=`chat-video/${body.conversationId}/${user.id}/${crypto.randomUUID()}.${extensions[body.contentType]}`;
  try{
    const uploadUrl=await getSignedUrl(getR2Client(),new PutObjectCommand({Bucket:getPrivateBucket(),Key:objectKey,ContentType:body.contentType}),{expiresIn:300});
    return NextResponse.json({uploadUrl,objectKey,expiresIn:300});
  }catch(error){
    console.error("Chat video upload signing failed",{name:error instanceof Error?error.name:"UnknownError"});
    return NextResponse.json({error:{code:"UPLOAD_SIGNING_FAILED",message:"Video upload unavailable"}},{status:503});
  }
}
