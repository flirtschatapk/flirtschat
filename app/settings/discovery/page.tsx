import type {Metadata} from "next";
import {DiscoveryPreferencesPage} from "@/components/settings/discovery-preferences-page";
export const metadata:Metadata={title:"Discovery Preferences",description:"Manage who appears in your Flirtschat discovery."};
export default function Page(){return <DiscoveryPreferencesPage/>}
