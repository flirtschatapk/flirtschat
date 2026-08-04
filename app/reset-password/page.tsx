import type { Metadata } from "next";import { AuthLayout } from "@/components/auth/auth-layout";import { ResetPasswordForm } from "@/components/auth/reset-password-form";
export const metadata:Metadata={title:"Reset password",description:"Create a new password for your Flirtschat account."};
export default function ResetPasswordPage(){return <AuthLayout mode="login"><ResetPasswordForm/></AuthLayout>}
