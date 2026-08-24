import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard", description: "Your Flirtschat connections." };
export default function DashboardPage() { redirect("/global"); }
