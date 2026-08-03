import type {Metadata} from "next";
import {PasswordSettingsPage} from "@/components/settings/password-settings-page";
export const metadata:Metadata={title:"Change Password",description:"Securely update your Flirtschat account password."};
export default function Page(){return <PasswordSettingsPage/>}
