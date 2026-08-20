import { createClient } from "@/lib/supabase/client";
import { canonicalVoiceMime } from "@/lib/chat/voice-media";
import type { ChatMessage, Conversation, MessageReaction, MessageStatus } from "./chat-types";

type OwnMember = { conversation_id: string; last_read_at: string | null; muted_until: string | null; pinned_at: string | null; cleared_at: string | null; hidden_at: string | null; chat_locked: boolean };
type OtherMember = OwnMember & { user_id: string };
type Profile = { id: string; display_name: string; username: string | null; last_seen_at: string | null; verified: boolean | null; photo_key: string | null };
export const CHAT_MESSAGE_PAGE_SIZE = 30;
export type MessageCursor = { createdAt: string; id: string };
export type MessagePage = { messages: ChatMessage[]; nextCursor: MessageCursor | null; hasMore: boolean };
export type MessageRow = { id: string; conversation_id: string; sender_id: string; body: string; kind: string; media_path: string | null; media_mime_type?: string | null; media_size_bytes?: number | null; media_duration_seconds?: number | null; reply_to: string | null; created_at: string; edited_at?: string | null; deleted_at?: string | null };
export function mapMessageRow(row: MessageRow, userId: string, otherLastReadAt?: string | null, reactions?: MessageReaction[], pinned?: boolean): ChatMessage { const status: MessageStatus = row.sender_id === userId && otherLastReadAt && new Date(otherLastReadAt) >= new Date(row.created_at) ? "seen" : row.sender_id === userId ? "sent" : "delivered"; const type = row.kind === "image" ? "photo" : row.kind === "voice" ? "voice" : "text"; const durationMatch = type === "voice" ? row.body.match(/(\d+)s\s*$/i) : null; const duration = row.media_duration_seconds ?? (durationMatch ? Number(durationMatch[1]) : undefined); const mediaUrl = type === "voice" && row.media_path ? `/api/media/chat-voice?key=${encodeURIComponent(row.media_path)}` : row.media_path || undefined; return { id: row.id, conversationId: row.conversation_id, sender: row.sender_id === userId ? "me" : "them", type, text: row.body, createdAt: new Date(row.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), createdAtIso: row.created_at, editedAt: row.edited_at || undefined, status, ...(reactions===undefined?{}:{reactions}), ...(pinned===undefined?{}:{pinned}), replyTo: row.reply_to || undefined, mediaUrl, mediaKey: row.media_path || undefined, mediaMimeType: row.media_mime_type || undefined, mediaSizeBytes: row.media_size_bytes || undefined, duration: Number.isFinite(duration) ? duration : undefined }; }
type ReactionRow = { message_id: string; user_id: string; emoji: string };
type PinRow = { message_id: string; user_id: string };
async function loadMessageActions(supabase: ReturnType<typeof createClient>, messageIds: string[], userId: string) {
  const reactions = new Map<string, MessageReaction[]>(), pins = new Set<string>();
  if (!messageIds.length) return { reactions, pins };
  const [reactionResult, pinResult] = await Promise.all([
    supabase.from("fc_message_reactions").select("message_id,user_id,emoji").in("message_id", messageIds),
    supabase.from("fc_message_pins").select("message_id,user_id").in("message_id", messageIds).eq("user_id", userId),
  ]);
  if (reactionResult.error) throw reactionResult.error;
  if (pinResult.error) throw pinResult.error;
  for (const row of (reactionResult.data ?? []) as ReactionRow[]) {
    const list = reactions.get(row.message_id) ?? [];
    const summary = list.find(item => item.emoji === row.emoji);
    if (summary) summary.count += 1;
    else list.push({ emoji: row.emoji, count: 1, reacted: row.user_id === userId });
    if (row.user_id === userId && summary) summary.reacted = true;
    reactions.set(row.message_id, list);
  }
  for (const row of (pinResult.data ?? []) as PinRow[]) pins.add(row.message_id);
  return { reactions, pins };
}
async function loadSingleMessageReactions(supabase: ReturnType<typeof createClient>, messageId: string, userId: string) {
  const actions = await loadMessageActions(supabase, [messageId], userId);
  return actions.reactions.get(messageId) ?? [];
}

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
  const { data: mine, error } = await supabase.from("fc_conversation_members").select("conversation_id,last_read_at,muted_until,pinned_at,cleared_at,hidden_at,chat_locked").eq("user_id", user.id);
  if (error) throw error;
  const ids = (mine ?? []).map(row => row.conversation_id);
  if (!ids.length) return [];
  const [conversationResult, memberResult, messageResult, profileResult] = await Promise.all([
    supabase.from("fc_conversations").select("id,updated_at,disappearing_seconds").in("id", ids).order("updated_at", { ascending: false }),
    supabase.from("fc_conversation_members").select("conversation_id,user_id,last_read_at").in("conversation_id", ids).neq("user_id", user.id),
    Promise.all(ids.map(conversationId => { const member = (mine as OwnMember[]).find(row => row.conversation_id === conversationId); let query = supabase.from("fc_messages").select("id,conversation_id,sender_id,body,kind,media_path,media_mime_type,media_size_bytes,media_duration_seconds,reply_to,created_at,edited_at,deleted_at").eq("conversation_id", conversationId).is("deleted_at", null); if (member?.cleared_at) query = query.gt("created_at", member.cleared_at); return query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(CHAT_MESSAGE_PAGE_SIZE + 1); })),
    supabase.rpc("fc_my_conversation_profiles"),
  ]);
  if (conversationResult.error) throw conversationResult.error;
  if (memberResult.error) throw memberResult.error;
  const messageRows = messageResult.flatMap(result => { if (result.error) throw result.error; return result.data ?? []; });
  const actions = await loadMessageActions(supabase, messageRows.map(row => row.id), user.id);
  const others = (memberResult.data ?? []) as OtherMember[];
  if (profileResult.error) throw profileResult.error;

  return (conversationResult.data ?? []).filter(conversation => { const member = (mine as OwnMember[]).find(row => row.conversation_id === conversation.id); return !member?.hidden_at || new Date(conversation.updated_at) > new Date(member.hidden_at); }).map(conversation => {
    const other = others.find(row => row.conversation_id === conversation.id);
    const profile = ((profileResult.data ?? []) as Profile[]).find(row => row.id === other?.user_id);
    const ownMember = (mine as OwnMember[]).find(row => row.conversation_id === conversation.id);
    const ownReadAt = ownMember?.last_read_at;
    const list = messageRows.filter(row => row.conversation_id === conversation.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime() || a.id.localeCompare(b.id));
    const pageRows = list.slice(-CHAT_MESSAGE_PAGE_SIZE);
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
      muted: Boolean(ownMember?.muted_until && new Date(ownMember.muted_until) > new Date()),
      pinned: Boolean(ownMember?.pinned_at),
      unread: list.filter(row => row.sender_id !== user.id && (!ownReadAt || new Date(row.created_at) > new Date(ownReadAt))).length,
      typing: false,
      lastActive: profile?.last_seen_at || "",
      lastMessage: last?.body || "Start a conversation",
      updatedAt: new Date(conversation.updated_at).toLocaleString(),
      sortAt: conversation.updated_at,
      match: true,
      disappearingSeconds: conversation.disappearing_seconds,
      chatLocked: Boolean(ownMember?.chat_locked),
      messages: pageRows.map(row => mapMessageRow(row as MessageRow, user.id, other?.last_read_at, actions.reactions.get(row.id), actions.pins.has(row.id))),
      messagesHasMore: list.length > CHAT_MESSAGE_PAGE_SIZE,
    } satisfies Conversation;
  });
}

export function saveConversations(_items: Conversation[]) { void _items; }

export async function updateConversationMember(conversationId: string, changes: { muted_until?: string | null; pinned_at?: string | null; cleared_at?: string | null; hidden_at?: string | null; chat_locked?: boolean }): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");
  const { error } = await supabase.from("fc_conversation_members").update(changes).eq("conversation_id", conversationId).eq("user_id", user.id);
  if (error) throw error;
}

export async function setDisappearingMessages(conversationId: string, seconds: number | null): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("fc_set_disappearing_messages", { requested_conversation: conversationId, requested_seconds: seconds });
  if (error) throw error;
}

export async function clearConversationForMe(conversationId: string): Promise<void> {
  await updateConversationMember(conversationId, { cleared_at: new Date().toISOString() });
}

export async function hideConversationForMe(conversationId: string): Promise<void> {
  await updateConversationMember(conversationId, { hidden_at: new Date().toISOString() });
}

// Backward-compatible name for the menu action; this is now a per-user hide,
// never a membership delete.
export async function deleteConversationForMe(conversationId: string): Promise<void> {
  await hideConversationForMe(conversationId);
}

export async function deleteMessageForEveryone(conversationId: string, messageId: string): Promise<void> {
  const supabase = createClient();
  const { data: existing, error: lookupError } = await supabase.from("fc_messages").select("id").eq("id", messageId).eq("conversation_id", conversationId).maybeSingle();
  if (lookupError) throw lookupError;
  if (!existing) throw new Error("MESSAGE_NOT_FOUND_OR_NOT_AUTHORIZED");
  const { error } = await supabase.from("fc_messages").update({ deleted_at: new Date().toISOString() }).eq("id", messageId).eq("conversation_id", conversationId);
  if (error) throw error;
}

export async function deleteMessageForMe(messageId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");
  const { error } = await supabase.from("fc_message_hidden").insert({ message_id: messageId, user_id: user.id });
  if (error && error.code !== "23505") throw error;
}

export async function setMessageReaction(messageId: string, emoji: string | null): Promise<MessageReaction[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");
  if (emoji === null) {
    const { error } = await supabase.from("fc_message_reactions").delete().eq("message_id", messageId).eq("user_id", user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("fc_message_reactions").upsert({ message_id: messageId, user_id: user.id, emoji }, { onConflict: "message_id,user_id" });
    if (error) throw error;
  }
  return loadSingleMessageReactions(supabase, messageId, user.id);
}

export async function getMessageReactions(messageId: string): Promise<MessageReaction[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  return loadSingleMessageReactions(supabase, messageId, user.id);
}

export async function setMessagePin(messageId: string, pinned: boolean): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");
  if (pinned) {
    const { error } = await supabase.from("fc_message_pins").upsert({ message_id: messageId, user_id: user.id }, { onConflict: "message_id,user_id" });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("fc_message_pins").delete().eq("message_id", messageId).eq("user_id", user.id);
    if (error) throw error;
  }
  return pinned;
}

export async function editMessage(conversationId: string, messageId: string, text: string): Promise<{ body: string; editedAt: string }> {
  const supabase = createClient();
  const clean = text.trim();
  if (!clean) throw new Error("Message cannot be empty");
  const { data, error } = await supabase.from("fc_messages").update({ body: clean, edited_at: new Date().toISOString() }).eq("id", messageId).eq("conversation_id", conversationId).eq("kind", "text").select("body,edited_at").single();
  if (error) throw error;
  return { body: data.body, editedAt: data.edited_at };
}

export async function getOlderMessages(conversationId: string, before: string, beforeId: string, limit = CHAT_MESSAGE_PAGE_SIZE): Promise<MessagePage> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { messages: [], nextCursor: null, hasMore: false };
  const { data: member } = await supabase.from("fc_conversation_members").select("cleared_at").eq("conversation_id", conversationId).eq("user_id", user.id).maybeSingle();
  let query = supabase.from("fc_messages").select("id,conversation_id,sender_id,body,kind,media_path,media_mime_type,media_size_bytes,media_duration_seconds,reply_to,created_at,edited_at,deleted_at").eq("conversation_id", conversationId).is("deleted_at", null).or(`created_at.lt.${before},and(created_at.eq.${before},id.lt.${beforeId})`); if (member?.cleared_at) query = query.gt("created_at", member.cleared_at);
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1);
  if (error) throw error;
  const rows = data ?? [];
  const pageRows = rows.slice(0, limit);
  const oldest = pageRows.at(-1);
  const actions = await loadMessageActions(supabase, pageRows.map(row => row.id), user.id);
  return {
    messages: pageRows.map(row => mapMessageRow(row as MessageRow, user.id, null, actions.reactions.get(row.id), actions.pins.has(row.id))).reverse(),
    nextCursor: oldest ? { createdAt: oldest.created_at, id: oldest.id } : null,
    hasMore: rows.length > limit,
  };
}

export async function getUnreadChatCount(): Promise<number> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data: memberships, error: membershipError } = await supabase.from("fc_conversation_members").select("conversation_id,last_read_at").eq("user_id", user.id);
  if (membershipError || !memberships?.length) return 0;
  const ids = memberships.map(row => row.conversation_id);
  const { data: messages, error } = await supabase.from("fc_messages").select("conversation_id,sender_id,created_at").in("conversation_id", ids).is("deleted_at", null);
  if (error) throw error;
  const reads = new Map(memberships.map(row => [row.conversation_id, row.last_read_at]));
  return (messages ?? []).filter(row => row.sender_id !== user.id && (!reads.get(row.conversation_id) || new Date(row.created_at) > new Date(reads.get(row.conversation_id)!))).length;
}

export async function sendMessage(conversation: Conversation, message: ChatMessage) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ...message, status: "failed" as const, sendError: { stage: "message" as const, code: "UNAUTHENTICATED" } };
  if (message.type === "voice") {
    const canonicalMime = canonicalVoiceMime(message.mediaMimeType);
    const baseMime = canonicalMime?.split(";", 1)[0] ?? "";
    const durationSeconds = typeof message.duration === "number" && Number.isFinite(message.duration) ? Math.round(message.duration) : 0;
    const mediaSizeBytes = message.mediaSizeBytes ?? 0;
    const keyPrefix = `chat-voice/${conversation.id}/${user.id}/`;
    const validKey = message.mediaKey?.startsWith(keyPrefix) && /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(webm|ogg)$/i.test(message.mediaKey.slice(keyPrefix.length));
    const validMime = baseMime === "audio/webm" || baseMime === "audio/ogg";
    const extensionMatchesMime = (message.mediaKey?.endsWith(".webm") && baseMime === "audio/webm") || (message.mediaKey?.endsWith(".ogg") && baseMime === "audio/ogg");
    const validSize = Number.isInteger(mediaSizeBytes) && mediaSizeBytes > 0 && mediaSizeBytes <= 10 * 1024 * 1024;
    const validDuration = durationSeconds > 0 && durationSeconds <= 60;
    if (!validKey || !validMime || !extensionMatchesMime || !validSize || !validDuration) {
      console.error("[VoiceMetadataInvalid]", { conversationId: conversation.id, blobMime: message.mediaMimeType, canonicalMime, baseMime, mediaSizeBytes: message.mediaSizeBytes, duration: message.duration, durationSeconds, validKey, validMime, extensionMatchesMime, validSize, validDuration });
      return { ...message, status: "failed" as const, sendError: { stage: "message" as const, code: "VOICE_METADATA_INVALID" } };
    }
    message = { ...message, duration: durationSeconds };
  }
  const { data, error } = await supabase.from("fc_messages").insert({ conversation_id: conversation.id, sender_id: user.id, body: message.type === "voice" ? "Sent you a voice message" : message.text, kind: message.type === "photo" ? "image" : message.type === "voice" ? "voice" : "text", media_path: message.mediaKey || (message.type === "voice" ? null : message.mediaUrl) || null, media_mime_type: message.type === "voice" ? canonicalVoiceMime(message.mediaMimeType) : message.mediaMimeType || null, media_size_bytes: message.mediaSizeBytes || null, media_duration_seconds: message.duration || null, reply_to: message.replyTo || null }).select("id,created_at,media_path,media_mime_type,media_size_bytes,media_duration_seconds").single();
  if (error) {
    if (message.type === "voice") {
      console.error("[VoiceDBInsertFailure]", {
        stage: "message",
        code: error.code,
        httpStatus: undefined,
        blobSize: message.mediaSizeBytes,
        blobMime: message.mediaMimeType,
        duration: message.duration,
        message: error.message,
        details: error.details,
        hint: error.hint,
        conversationId: conversation.id,
      });
    }
    return { ...message, status: "failed" as const, sendError: { stage: "message" as const, code: error.code, message: error.message, details: error.details, hint: error.hint } };
  }
  const secureMediaUrl = message.type === "voice" && data.media_path
    ? `/api/media/chat-voice?key=${encodeURIComponent(data.media_path)}`
    : message.mediaUrl;
  if (process.env.NODE_ENV === "development") {
    console.debug("[ChatState:canonical-result]", { conversationId: conversation.id, canonicalId: data.id });
    console.debug("[ChatState:canonical-replace]", { conversationId: conversation.id, draftId: message.id, canonicalId: data.id });
  }
  return { ...message, id: data.id, createdAt: new Date(data.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }), createdAtIso: data.created_at, status: "sent" as const, mediaUrl: secureMediaUrl, mediaKey: data.media_path || message.mediaKey, mediaMimeType: data.media_mime_type || message.mediaMimeType, mediaSizeBytes: data.media_size_bytes || message.mediaSizeBytes, duration: data.media_duration_seconds || message.duration };
}
