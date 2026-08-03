import type {Metadata} from "next";
import {PrivacySettingsPage} from "@/components/settings/privacy-settings-page";
export const metadata:Metadata={title:"Privacy Settings",description:"Control your visibility and privacy on Flirtschat."};
export default function Page(){return <PrivacySettingsPage/>}
