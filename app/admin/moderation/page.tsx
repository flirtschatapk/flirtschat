import type{Metadata}from"next";import{AdminModeration}from"@/components/admin/admin-moderation";
export const metadata:Metadata={title:"Reports & Moderation",description:"Review FLIRTSCHAT safety reports and appeals."};
export default function ModerationPage(){return <AdminModeration/>}
