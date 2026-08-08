import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function GET(request:Request){if(process.env.NODE_ENV==="development")console.info("[AuthTrace] logout route invocation");const supabase=await createClient();if(process.env.NODE_ENV==="development")console.info("[AuthTrace] manual_logout");await supabase.auth.signOut();return NextResponse.redirect(new URL("/login",request.url))}
