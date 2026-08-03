import type { Metadata } from "next";import { AuthLayout } from "@/components/auth/auth-layout";import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
export const metadata:Metadata={title:"Forgot password",description:"Request a secure Flirtschat password reset link."};
export default function ForgotPasswordPage(){return <AuthLayout mode="login"><ForgotPasswordForm/></AuthLayout>}
