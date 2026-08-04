import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {getPostAuthDestination} from "@/lib/auth/post-auth-destination";
export default async function EmailVerifiedPage(){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login?error=oauth_callback_failed");redirect(await getPostAuthDestination(user.id))}
