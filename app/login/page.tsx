import type { Metadata } from "next";import { AuthLayout } from "@/components/auth/auth-layout";import { LoginForm } from "@/components/auth/login-form";
export const metadata:Metadata={title:"Log in",description:"Log in to your Flirtschat account."};
export default function LoginPage(){return <AuthLayout mode="login"><LoginForm/></AuthLayout>}
