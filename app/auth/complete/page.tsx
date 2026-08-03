import {AuthSessionBridge} from "@/components/auth/auth-session-bridge";

export default async function AuthCompletePage({searchParams}:{searchParams:Promise<{next?:string}>}){
  const{next}=await searchParams;
  const safeNext=next?.startsWith("/")&&!next.startsWith("//")?next:"/onboarding";
  return <AuthSessionBridge next={safeNext}/>;
}
