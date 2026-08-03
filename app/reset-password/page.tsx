import type { Metadata } from "next";import { AuthLayout } from "@/components/auth/auth-layout";import { ResetPasswordForm } from "@/components/auth/reset-password-form";
export const metadata:Metadata={title:"Reset password",description:"Create a new password for your Flirtschat account."};
export default async function ResetPasswordPage({searchParams}:{searchParams:Promise<{token?:string}>}){const {token}=await searchParams;return <AuthLayout mode="login"><ResetPasswordForm token={token??null}/></AuthLayout>}
