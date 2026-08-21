import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getPrivateBucket,getR2Client} from "@/lib/r2/server";

const videoKeyPattern=/^chat-video\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp4|webm|mov)$/i;
const unavailable=()=>NextResponse.json({error:{code:"MEDIA_NOT_FOUND",message:"Media unavailable"}},{status:404,headers:{"Cache-Control":"private, no-store"}});

export async function GET(request:Request){
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:{code:"UNAUTHENTICATED",message:"Sign in required"}},{status:401,headers:{"Cache-Control":"private, no-store"}});
  const messageId=new URL(request.url).searchParams.get("messageId")??"";
  if(!/^[0-9a-f-]{36}$/i.test(messageId))return unavailable();
  const[{data:message,error:messageError},{data:membership,error:membershipError}]=await Promise.all([
    supabase.from("fc_messages").select("id,conversation_id,kind,media_path,created_at,deleted_at").eq("id",messageId).maybeSingle(),
    supabase.from("fc_conversation_members").select("conversation_id,cleared_at").eq("user_id",user.id),
  ]);
  if(messageError||!message||message.deleted_at||message.kind!=="video"||typeof message.media_path!=="string"||!videoKeyPattern.test(message.media_path))return unavailable();
  const ownMembership=(membership??[]).find(row=>row.conversation_id===message.conversation_id);
  if(membershipError||!ownMembership)return unavailable();
  if(ownMembership.cleared_at&&new Date(message.created_at)<=new Date(ownMembership.cleared_at))return unavailable();
  const[{data:hidden,error:hiddenError},{data:conversation,error:conversationError}]=await Promise.all([
    supabase.from("fc_message_hidden").select("message_id").eq("message_id",message.id).eq("user_id",user.id).maybeSingle(),
    supabase.from("fc_conversations").select("disappearing_seconds").eq("id",message.conversation_id).maybeSingle(),
  ]);
  if(hiddenError||hidden||conversationError||!conversation)return unavailable();
  if(conversation.disappearing_seconds!==null&&conversation.disappearing_seconds!==undefined){
    const expiresAt=new Date(message.created_at).getTime()+Number(conversation.disappearing_seconds)*1000;
    if(!Number.isFinite(expiresAt)||expiresAt<=Date.now())return unavailable();
  }
  try{
    const url=await getSignedUrl(getR2Client(),new GetObjectCommand({Bucket:getPrivateBucket(),Key:message.media_path}),{expiresIn:120});
    const response=NextResponse.redirect(url,307);
    response.headers.set("Cache-Control","private, no-store");
    response.headers.set("Content-Disposition","inline");
    return response;
  }catch(error){
    console.error("Chat video media signing failed",{name:error instanceof Error?error.name:"UnknownError"});
    return NextResponse.json({error:{code:"MEDIA_UNAVAILABLE",message:"Media unavailable"}},{status:503,headers:{"Cache-Control":"private, no-store"}});
  }
}
