import {NextResponse} from "next/server";
import {usernameSchema} from "@/lib/auth-schema";
import {createClient} from "@/lib/supabase/server";

export async function POST(request:Request){
  const body=await request.json().catch(()=>null) as {username?:unknown;excludeUserId?:unknown}|null;
  const parsed=usernameSchema.safeParse(body?.username);
  if(!parsed.success)return NextResponse.json({available:false,valid:false},{status:400});
  const supabase=await createClient();
  const{data:{user}}=await supabase.auth.getUser();
  const excluded=typeof body?.excludeUserId==="string"&&user?.id===body.excludeUserId?user.id:null;
  const{data,error}=await supabase.rpc("fc_is_username_available",{candidate:parsed.data,excluded_user:excluded});
  if(error){if(process.env.NODE_ENV==="development")console.error("Username availability failed",{code:error.code});return NextResponse.json({available:false},{status:503})}
  return NextResponse.json({available:Boolean(data),valid:true});
}
