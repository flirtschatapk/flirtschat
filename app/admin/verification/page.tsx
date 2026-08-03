import type{Metadata}from"next";import{AdminVerification}from"@/components/admin/admin-verification";
export const metadata:Metadata={title:"Verification Center",description:"Review identity and selfie verification requests."};
export default function VerificationPage(){return <AdminVerification/>}
