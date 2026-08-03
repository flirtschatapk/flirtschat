import type {Metadata} from "next";
import {EmailPhonePage} from "@/components/settings/email-phone-page";
export const metadata:Metadata={title:"Email & Phone",description:"Manage and verify your Flirtschat contact details."};
export default function Page(){return <EmailPhonePage/>}
