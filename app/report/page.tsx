import type {Metadata} from "next";import {CommunityHub} from "@/components/community/community-hub";
export const metadata:Metadata={title:"Report a member"};export default function Page(){return <CommunityHub mode="report"/>}
