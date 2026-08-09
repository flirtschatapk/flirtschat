import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getPrivateBucket,getR2Client} from "@/lib/r2/server";

const keyPattern=/^chat-voice\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(webm|ogg)$/i;

export async function GET(request:Request){
  const supabase=await createClient(),{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:{code:"UNAUTHENTICATED",message:"Sign in required"}},{status:401});
  const key=new URL(request.url).searchParams.get("key")??"";
  const match=key.match(keyPattern);
  if(!match)return NextResponse.json({error:{code:"INVALID_MEDIA_KEY",message:"Media unavailable"}},{status:400});
  const[,conversationIdFromKey,senderIdFromKey]=match;
  const{data:message,error:messageError}=await supabase.from("fc_messages").select("id,conversation_id,sender_id,kind,media_path,media_mime_type,media_size_bytes,media_duration_seconds").eq("media_path",key).maybeSingle();
  if(messageError||!message)return NextResponse.json({error:{code:"MEDIA_NOT_FOUND",message:"Media unavailable"}},{status:404});
  if(message.kind!=="voice"||message.media_path!==key||message.conversation_id!==conversationIdFromKey||message.sender_id!==senderIdFromKey)return NextResponse.json({error:{code:"MEDIA_NOT_FOUND",message:"Media unavailable"}},{status:404});
  const webmMime=message.media_mime_type==="audio/webm"||message.media_mime_type==="audio/webm;codecs=opus";
  const oggMime=message.media_mime_type==="audio/ogg"||message.media_mime_type==="audio/ogg;codecs=opus";
  if((key.endsWith(".webm")&&!webmMime)||(key.endsWith(".ogg")&&!oggMime)||!Number.isInteger(message.media_size_bytes)||!message.media_size_bytes||message.media_size_bytes>10*1024*1024||!Number.isInteger(message.media_duration_seconds)||!message.media_duration_seconds||message.media_duration_seconds>300)return NextResponse.json({error:{code:"MEDIA_NOT_FOUND",message:"Media unavailable"}},{status:404});
  const{data:membership,error:membershipError}=await supabase.from("fc_conversation_members").select("conversation_id").eq("conversation_id",message.conversation_id).eq("user_id",user.id).maybeSingle();
  if(membershipError||!membership)return NextResponse.json({error:{code:"MEDIA_FORBIDDEN",message:"Media unavailable"}},{status:403});
  try{
    const url=await getSignedUrl(getR2Client(),new GetObjectCommand({Bucket:getPrivateBucket(),Key:key}),{expiresIn:120});
    if(new URL(request.url).searchParams.get("format")==="json")return NextResponse.json({url,expiresIn:120});
    return NextResponse.redirect(url,307);
  }catch(error){console.error("Voice media signing failed",{name:error instanceof Error?error.name:"UnknownError"});return NextResponse.json({error:{code:"MEDIA_UNAVAILABLE",message:"Media unavailable"}},{status:503})}
}
