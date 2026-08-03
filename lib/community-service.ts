import {createClient} from "@/lib/supabase/client";

export const reportCategories=["Fake Profile","Spam","Scam","Harassment","Nudity","Hate Speech","Underage","Other"] as const;
export type ReportCategory=(typeof reportCategories)[number];
export type CommunityProfile={id:string;display_name:string;username:string;last_seen_at:string;premium:boolean};

export async function currentUser(){const supabase=createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Please sign in to continue.");return user}
export async function reportUser(reportedId:string,category:ReportCategory,details:string,photoId?:string,evidenceObjectKey?:string){const supabase=createClient(),user=await currentUser();const {error}=await supabase.from("fc_reports").insert({reporter_id:user.id,reported_id:reportedId,category,details,photo_id:photoId||null,evidence_object_key:evidenceObjectKey||null});if(error)throw error}
export async function blockUser(blockedId:string,reason="Safety block"){const supabase=createClient(),user=await currentUser();const {error}=await supabase.from("fc_blocks").upsert({blocker_id:user.id,blocked_id:blockedId,reason},{onConflict:"blocker_id,blocked_id"});if(error)throw error}
export async function unblockUserRemote(blockedId:string){const supabase=createClient(),user=await currentUser();const {error}=await supabase.from("fc_blocks").delete().eq("blocker_id",user.id).eq("blocked_id",blockedId);if(error)throw error}
export async function recordVisit(viewedId:string){const supabase=createClient();const {error}=await supabase.rpc("fc_record_profile_visit",{viewed:viewedId});if(error)throw error}
export async function uploadReportEvidence(file:File){const prepared=await fetch("/api/uploads/report-evidence",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contentType:file.type,size:file.size})}),signed=await prepared.json() as {uploadUrl?:string;objectKey?:string;error?:string};if(!prepared.ok||!signed.uploadUrl||!signed.objectKey)throw new Error(signed.error||"Evidence upload failed");const uploaded=await fetch(signed.uploadUrl,{method:"PUT",headers:{"content-type":file.type},body:file});if(!uploaded.ok)throw new Error("Evidence upload failed");return signed.objectKey}
export function subscribe(table:string,filter:string,onChange:()=>void){const supabase=createClient();const channel=supabase.channel(`fc-${table}-${crypto.randomUUID()}`).on("postgres_changes",{event:"*",schema:"public",table,filter},onChange).subscribe();return()=>{void supabase.removeChannel(channel)}}
