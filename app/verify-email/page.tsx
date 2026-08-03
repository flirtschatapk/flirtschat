import type { Metadata } from "next";import { AuthLayout } from "@/components/auth/auth-layout";import { VerifyEmailCard } from "@/components/auth/verify-email-card";
export const metadata:Metadata={title:"Verify your email",description:"Verify your email to activate Flirtschat."};
export default async function VerifyEmailPage({searchParams}:{searchParams:Promise<{email?:string}>}){const {email}=await searchParams;return <AuthLayout mode="signup"><VerifyEmailCard email={email??"your email address"}/></AuthLayout>}
