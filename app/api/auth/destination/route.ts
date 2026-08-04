import {NextResponse} from "next/server";
import {ensureInitialProfile,getPostAuthDestination} from "@/lib/auth/post-auth-destination";
import {createClient} from "@/lib/supabase/server";

export async function POST(){
  const supabase=await createClient();
  const{data:{user},error}=await supabase.auth.getUser();
  if(error||!user)return NextResponse.json({message:"Authentication required"},{status:401});
  try{await ensureInitialProfile(user);return NextResponse.json({destination:await getPostAuthDestination(user.id)})}
  catch(error){if(process.env.NODE_ENV==="development")console.error("Post-auth routing failed",error);return NextResponse.json({message:"Unable to load account"},{status:503})}
}
