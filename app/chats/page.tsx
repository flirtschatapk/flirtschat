import type{Metadata}from"next";import{ChatLayout}from"@/components/chat/chat-layout";
export const metadata:Metadata={title:"Messages | Flirtschat",description:"Your Flirtschat conversations."};
export default function ChatsPage(){return <ChatLayout/>}
