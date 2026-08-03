import type {Metadata} from "next";
import {ContactPage} from "@/components/contact-page";

export const metadata:Metadata={title:"Contact Us",description:"Contact the Flirtschat support team for account, safety, billing, or technical help."};

export default function Page(){return <ContactPage/>}
