import type {Metadata} from "next";import {CommunityHub} from "@/components/community/community-hub";
export const metadata:Metadata={title:"Photo moderation"};export default function Page(){return <CommunityHub mode="photos"/>}
