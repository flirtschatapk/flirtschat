import type {Metadata} from "next";
import {AccountInformationForm} from "@/components/profile/account-information-form";

export const metadata:Metadata={title:"Account Information",description:"Update your Flirtschat account and profile details."};
export default function ProfilePage(){return <AccountInformationForm/>}
