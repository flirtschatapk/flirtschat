import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, Conversation, MessageStatus } from "./chat-types";

type OwnMember = { conversation_id: string; last_read_at: string | null };
type OtherMember = OwnMember & { user_id: string };
type Profile = { id: string; display_name: string; username: string | null; last_seen_at: string | null; verified: boolean | null; photo_key: string | null };

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
    supabase.from("fc_messages").select("id,conversation_id,sender_id,body,kind,media_path,reply_to,created_at").in("conversation_id", ids).is("deleted_at", null).order("created_at"),
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
      messages: list.map(row => {
        const status: MessageStatus = row.sender_id === user.id && other?.last_read_at && new Date(other.last_read_at) >= new Date(row.created_at) ? "seen" : "delivered";
        return { id: row.id, conversationId: conversation.id, sender: row.sender_id === user.id ? "me" : "them", type: row.kind === "image" ? "photo" : row.kind === "voice" ? "voice" : "text", text: row.body, createdAt: new Date(row.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), status, replyTo: row.reply_to || undefined, mediaUrl: row.media_path || undefined } as ChatMessage;
      }),
    } satisfies Conversation;
  });
}

export function saveConversations(_items: Conversation[]) { void _items; }

export async function sendMessage(conversation: Conversation, message: ChatMessage) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...message, status: "failed" as const };
  const { data, error } = await supabase.from("fc_messages").insert({ conversation_id: conversation.id, sender_id: user.id, body: message.text, kind: message.type === "photo" ? "image" : message.type === "voice" ? "voice" : "text", media_path: message.mediaUrl || null, reply_to: message.replyTo || null }).select("id,created_at").single();
  if (error) return { ...message, status: "failed" as const };
  return { ...message, id: data.id, createdAt: new Date(data.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), status: "sent" as const };
}
