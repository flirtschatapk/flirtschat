import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, Conversation, MessageStatus } from "./chat-types";

type OwnMember = { conversation_id: string; last_read_at: string | null };
type OtherMember = OwnMember & { user_id: string };
type Profile = { id: string; display_name: string; username: string | null; last_seen_at: string | null; verified: boolean | null; photo_key: string | null };
export type MessageRow = { id: string; conversation_id: string; sender_id: string; body: string; kind: string; media_path: string | null; media_mime_type?: string | null; media_size_bytes?: number | null; media_duration_seconds?: number | null; reply_to: string | null; created_at: string };
export function mapMessageRow(row: MessageRow, userId: string, otherLastReadAt?: string | null): ChatMessage { const status: MessageStatus = row.sender_id === userId && otherLastReadAt && new Date(otherLastReadAt) >= new Date(row.created_at) ? "seen" : row.sender_id === userId ? "sent" : "delivered"; const type = row.kind === "image" ? "photo" : row.kind === "voice" ? "voice" : "text"; const durationMatch = type === "voice" ? row.body.match(/(\d+)s\s*$/i) : null; const duration = row.media_duration_seconds ?? (durationMatch ? Number(durationMatch[1]) : undefined); const mediaUrl = type === "voice" && row.media_path ? `/api/media/chat-voice?key=${encodeURIComponent(row.media_path)}` : row.media_path || undefined; return { id: row.id, conversationId: row.conversation_id, sender: row.sender_id === userId ? "me" : "them", type, text: row.body, createdAt: new Date(row.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), status, replyTo: row.reply_to || undefined, mediaUrl, mediaKey: row.media_path || undefined, mediaMimeType: row.media_mime_type || undefined, mediaSizeBytes: row.media_size_bytes || undefined, duration: Number.isFinite(duration) ? duration : undefined }; }

export async function openMatchConversation(matchId: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("fc_get_or_create_match_conversation", { requested_match: matchId });
  if (error) throw error;
  if (typeof data !== "string" || !data) throw new Error("Conversation was not created");
  return data;
}

export async function markMatchViewed(matchId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("fc_mark_match_viewed", { requested_match: matchId });
  if (error) throw error;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("fc_conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", user.id);
  if (error) throw error;
}

export async function getConversations(): Promise<Conversation[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: mine, error } = await supabase.from("fc_conversation_members").select("conversation_id,last_read_at").eq("user_id", user.id);
  if (error) throw error;
  const ids = (mine ?? []).map(row => row.conversation_id);
  if (!ids.length) return [];
  const [conversationResult, memberResult, messageResult] = await Promise.all([
    supabase.from("fc_conversations").select("id,updated_at").in("id", ids).order("updated_at", { ascending: false }),
    supabase.from("fc_conversation_members").select("conversation_id,user_id,last_read_at").in("conversation_id", ids).neq("user_id", user.id),
    supabase.from("fc_messages").select("id,conversation_id,sender_id,body,kind,media_path,media_mime_type,media_size_bytes,media_duration_seconds,reply_to,created_at").in("conversation_id", ids).is("deleted_at", null).order("created_at"),
  ]);
  if (conversationResult.error) throw conversationResult.error;
  if (memberResult.error) throw memberResult.error;
  if (messageResult.error) throw messageResult.error;
  const others = (memberResult.data ?? []) as OtherMember[];
  const otherIds = [...new Set(others.map(row => row.user_id))];
  const profileResult = otherIds.length
    ? await supabase.rpc("fc_my_conversation_profiles")
    : { data: [] as Profile[], error: null };
  if (profileResult.error) throw profileResult.error;

  return (conversationResult.data ?? []).map(conversation => {
    const other = others.find(row => row.conversation_id === conversation.id);
    const profile = ((profileResult.data ?? []) as Profile[]).find(row => row.id === other?.user_id);
    const ownReadAt = (mine as OwnMember[]).find(row => row.conversation_id === conversation.id)?.last_read_at;
    const list = (messageResult.data ?? []).filter(row => row.conversation_id === conversation.id);
    const last = list.at(-1);
    return {
      id: conversation.id,
      profileId: profile?.id || "",
      name: profile?.display_name || profile?.username || "Flirtschat member",
      username: profile?.username || "",
      position: "0% 0%",
      avatarUrl: profile?.photo_key ? `/api/media/profile-photo?key=${encodeURIComponent(profile.photo_key)}` : null,
      online: false,
      verified: Boolean(profile?.verified),
      favorite: false,
      muted: false,
      pinned: false,
      unread: list.filter(row => row.sender_id !== user.id && (!ownReadAt || new Date(row.created_at) > new Date(ownReadAt))).length,
      typing: false,
      lastActive: profile?.last_seen_at || "",
      lastMessage: last?.body || "Start a conversation",
      updatedAt: new Date(conversation.updated_at).toLocaleString(),
      sortAt: conversation.updated_at,
      match: true,
      messages: list.map(row => mapMessageRow(row as MessageRow, user.id, other?.last_read_at)),
    } satisfies Conversation;
  });
}

export function saveConversations(_items: Conversation[]) { void _items; }

export async function sendMessage(conversation: Conversation, message: ChatMessage) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...message, status: "failed" as const };
  if (message.type === "voice") {
    const keyPrefix = `chat-voice/${conversation.id}/${user.id}/`;
    const validKey = message.mediaKey?.startsWith(keyPrefix) && /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webm|ogg)$/i.test(message.mediaKey.slice(keyPrefix.length));
    const validMime = ["audio/webm", "audio/webm;codecs=opus", "audio/ogg", "audio/ogg;codecs=opus"].includes(message.mediaMimeType ?? "");
    const extensionMatchesMime = (message.mediaKey?.endsWith(".webm") && (message.mediaMimeType === "audio/webm" || message.mediaMimeType === "audio/webm;codecs=opus")) || (message.mediaKey?.endsWith(".ogg") && (message.mediaMimeType === "audio/ogg" || message.mediaMimeType === "audio/ogg;codecs=opus"));
    if (!validKey || !validMime || !extensionMatchesMime || !Number.isInteger(message.mediaSizeBytes) || !message.mediaSizeBytes || message.mediaSizeBytes > 10 * 1024 * 1024 || !Number.isInteger(message.duration) || !message.duration || message.duration > 300) return { ...message, status: "failed" as const };
  }
  const { data, error } = await supabase.from("fc_messages").insert({ conversation_id: conversation.id, sender_id: user.id, body: message.type === "voice" ? "Sent you a voice message" : message.text, kind: message.type === "photo" ? "image" : message.type === "voice" ? "voice" : "text", media_path: message.mediaKey || (message.type === "voice" ? null : message.mediaUrl) || null, media_mime_type: message.mediaMimeType || null, media_size_bytes: message.mediaSizeBytes || null, media_duration_seconds: message.duration || null, reply_to: message.replyTo || null }).select("id,created_at,media_path,media_mime_type,media_size_bytes,media_duration_seconds").single();
  if (error) return { ...message, status: "failed" as const };
  return { ...message, id: data.id, createdAt: new Date(data.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), status: "sent" as const, mediaKey: data.media_path || message.mediaKey, mediaMimeType: data.media_mime_type || message.mediaMimeType, mediaSizeBytes: data.media_size_bytes || message.mediaSizeBytes, duration: data.media_duration_seconds || message.duration };
}
