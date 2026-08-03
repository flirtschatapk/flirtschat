import type {Metadata} from "next";
import {LoginSecurityPage} from "@/components/settings/login-security-page";
export const metadata:Metadata={title:"Login & Security",description:"Manage Flirtschat login protection and active devices."};
export default function Page(){return <LoginSecurityPage/>}
