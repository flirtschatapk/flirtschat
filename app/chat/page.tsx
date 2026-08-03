import type {Metadata} from "next";
import {ConversationList} from "@/components/chat/conversation-list";
export const metadata:Metadata={title:"Conversations",description:"Your Flirtschat conversations."};
export default function ConversationsPage(){return <ConversationList/>}
