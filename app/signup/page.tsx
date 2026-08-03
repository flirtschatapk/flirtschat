import type { Metadata } from "next";import { AuthLayout } from "@/components/auth/auth-layout";import { SignupFlow } from "@/components/auth/signup-flow";
export const metadata:Metadata={title:"Create your account",description:"Create a Flirtschat profile in three easy steps."};
export default function SignupPage(){return <AuthLayout mode="signup"><SignupFlow/></AuthLayout>}
