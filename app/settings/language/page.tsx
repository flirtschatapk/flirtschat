import type {Metadata} from "next";
import {LanguageSettingsPage} from "@/components/settings/language-settings-page";
export const metadata:Metadata={title:"Language Settings",description:"Choose your Flirtschat app language."};
export default function Page(){return <LanguageSettingsPage/>}
