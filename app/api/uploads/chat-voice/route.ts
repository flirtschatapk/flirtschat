import {PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getPrivateBucket,getR2Client} from "@/lib/r2/server";
import {canonicalVoiceMime,voiceMimeExtension} from "@/lib/chat/voice-media";

const maxBytes=10*1024*1024;

export async function POST(request:Request){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:{code:"UNAUTHENTICATED",message:"Sign in required"}},{status:401});
  const body=await request.json().catch(()=>null) as {conversationId?:string;contentType?:string;size?:number;durationSeconds?:number}|null;
  const contentType=canonicalVoiceMime(body?.contentType);
  if(!body?.conversationId||!contentType)return NextResponse.json({error:{code:"INVALID_AUDIO",message:"Unsupported audio format"}},{status:400});
  const size=body.size;
  const durationSeconds=body.durationSeconds;
  if(typeof size!=="number"||!Number.isInteger(size)||size<1||size>maxBytes)return NextResponse.json({error:{code:"INVALID_AUDIO_SIZE",message:"Voice message is too large"}},{status:413});
  if(typeof durationSeconds!=="number"||!Number.isInteger(durationSeconds)||durationSeconds<1||durationSeconds>60)return NextResponse.json({error:{code:"INVALID_AUDIO_DURATION",message:"Voice message duration is invalid"}},{status:400});
  const{data:membership,error:membershipError}=await supabase.from("fc_conversation_members").select("conversation_id").eq("conversation_id",body.conversationId).eq("user_id",user.id).maybeSingle();
  if(membershipError||!membership)return NextResponse.json({error:{code:"NOT_CONVERSATION_MEMBER",message:"Conversation unavailable"}},{status:403});
  const objectKey=`chat-voice/${body.conversationId}/${user.id}/${crypto.randomUUID()}.${voiceMimeExtension(contentType)}`;
  try{
    // The browser cannot reliably set an exact Content-Length header for a
    // cross-origin presigned PUT. Keep the size validation above, but sign
    // only the header the browser can send consistently.
    const command=new PutObjectCommand({Bucket:getPrivateBucket(),Key:objectKey,ContentType:contentType});
    const uploadUrl=await getSignedUrl(getR2Client(),command,{expiresIn:300});
    return NextResponse.json({uploadUrl,objectKey,expiresIn:300});
  }catch(error){console.error("Voice upload signing failed",{name:error instanceof Error?error.name:"UnknownError"});return NextResponse.json({error:{code:"UPLOAD_SIGNING_FAILED",message:"Voice upload unavailable"}},{status:503})}
}
