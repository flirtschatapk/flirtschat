import type{Metadata}from"next";import{ChatLayout}from"@/components/chat/chat-layout";
export const metadata:Metadata={title:"Conversation | Flirtschat",description:"Chat securely with your match."};
export default async function ConversationPage({params}:{params:Promise<{conversationId:string}>}){const{conversationId}=await params;return <ChatLayout conversationId={conversationId}/>}
