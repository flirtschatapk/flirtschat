import {createClient} from "@/lib/supabase/client";

export type ConnectStatus = "none" | "requested" | "incoming" | "connected";
export type ConnectFilter = "for_you" | "nearby" | "new" | "verified";
export type ConnectPerson = {
  id: string;
  name: string;
  username: string | null;
  age: number | null;
  city: string;
  country: string;
  verified: boolean;
  premium: boolean;
  createdAt: string;
  photoUrl: string | null;
  connectionId: string | null;
  status: ConnectStatus;
};
export type ConnectPage = {people: ConnectPerson[]; nextBefore: {createdAt: string; id: string} | null; hasMore: boolean};

type ConnectRow = {
  id: string; username: string | null; display_name: string | null; age: number | null;
  country: string | null; city: string | null; verified: boolean | null; premium: boolean | null;
  created_at: string; photo_key: string | null;
  connection_id: string | null; connection_status: string | null; connection_requester_id: string | null; connection_is_requester: boolean | null;
};

const text = (value: string | null) => value?.trim() || "";

function mapRow(row: ConnectRow): ConnectPerson {
  const status: ConnectStatus = row.connection_status === "accepted" ? "connected" : row.connection_status === "pending" && row.connection_is_requester ? "requested" : row.connection_status === "pending" ? "incoming" : "none";
  return {
    id: row.id,
    name: text(row.display_name) || text(row.username) || "Flirtschat member",
    username: text(row.username) || null,
    age: row.age,
    city: text(row.city),
    country: text(row.country),
    verified: Boolean(row.verified),
    premium: Boolean(row.premium),
    createdAt: row.created_at,
    photoUrl: row.photo_key ? `/api/media/profile-photo?key=${encodeURIComponent(row.photo_key)}` : null,
    connectionId: row.connection_id,
    status,
  };
}

export async function getConnectPeople(filter: ConnectFilter, search: string, before?: {createdAt: string; id: string} | null): Promise<ConnectPage> {
  const supabase = createClient();
  const {data, error} = await supabase.rpc("fc_connect_people", {
    search_term: search.trim() || null,
    filter_key: filter,
    requested_before: before?.createdAt || null,
    requested_before_id: before?.id || null,
    requested_limit: 31,
  });
  if (error) throw error;
  const rows = (data ?? []) as ConnectRow[];
  const hasMore = rows.length > 30;
  const page = rows.slice(0, 30).map(mapRow);
  const last = page.at(-1);
  return {people: page, nextBefore: hasMore && last ? {createdAt:last.createdAt,id:last.id} : null, hasMore};
}

export async function requestConnection(targetUser: string): Promise<{id: string; status: ConnectStatus}> {
  const supabase = createClient();
  const {data, error} = await supabase.rpc("fc_request_connection", {target_user: targetUser});
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.connection_id) throw new Error("Connection request unavailable");
  return {id: String(row.connection_id), status: row.connection_status === "accepted" ? "connected" : "requested"};
}

export async function acceptConnection(connectionId: string): Promise<void> {
  const {error} = await createClient().rpc("fc_accept_connection", {requested_connection: connectionId});
  if (error) throw error;
}

export async function declineConnection(connectionId: string): Promise<void> {
  const {error} = await createClient().rpc("fc_decline_connection", {requested_connection: connectionId});
  if (error) throw error;
}

export async function openConnectionConversation(connectionId: string): Promise<string> {
  const {data, error} = await createClient().rpc("fc_get_or_create_connection_conversation", {requested_connection: connectionId});
  if (error) throw error;
  if (typeof data !== "string" || !data) throw new Error("Conversation unavailable");
  return data;
}
