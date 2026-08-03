import type{Metadata}from"next";import{AdminPremium}from"@/components/admin/admin-premium";
export const metadata:Metadata={title:"Premium Management",description:"Manage plans, subscriptions, billing and promotions."};export default function PremiumAdminPage(){return <AdminPremium/>}
