import type { Metadata } from "next";import { AuthLayout } from "@/components/auth/auth-layout";import { EmailSuccessCard } from "@/components/auth/email-success-card";
export const metadata:Metadata={title:"Email verified",description:"Your Flirtschat email has been verified."};
export default async function EmailVerifiedPage({searchParams}:{searchParams:Promise<{token?:string,new?:string}>}){const params=await searchParams;return <AuthLayout mode="signup"><EmailSuccessCard token={params.token??null} newUser={params.new!=="0"}/></AuthLayout>}
