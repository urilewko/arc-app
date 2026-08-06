"use client";
import { supabase } from "@/lib/supabase";

/**
 * Conversation history and long-term memory for the agent.
 *
 * Both live behind RLS like the rest of the app, so these run in the browser
 * under the signed-in user rather than server-side with the anon key.
 */

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: StoredMessage[];
  updatedAt: string;
}

export interface Memory {
  id: string;
  content: string;
  /** העדפה · עובדה · החלטה · לקוח */
  kind: string;
  createdAt: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// ── Conversations ──────────────────────────────────────────────────

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("agent_conversations")
    .select("id,title,messages,updated_at")
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("list conversations:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: (r.title as string) || "שיחה ללא כותרת",
    messages: (r.messages as StoredMessage[]) ?? [],
    updatedAt: r.updated_at as string,
  }));
}

/** Derives a readable title from the opening question. */
function titleFrom(messages: StoredMessage[]): string {
  const first = messages.find((m) => m.role === "user")?.content ?? "";
  const line = first.split("\n")[0].trim();
  return line.length > 60 ? line.slice(0, 57) + "…" : line || "שיחה חדשה";
}

export async function saveConversation(
  id: string,
  messages: StoredMessage[]
): Promise<void> {
  const row = {
    id,
    title: titleFrom(messages),
    messages,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("agent_conversations")
    .upsert(row, { onConflict: "id" });
  if (error) console.error("save conversation:", error.message);
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from("agent_conversations")
    .delete()
    .eq("id", id);
  if (error) console.error("delete conversation:", error.message);
}

export const newConversationId = () => `conv_${uid()}`;

// ── Memory ─────────────────────────────────────────────────────────

export async function listMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from("agent_memory")
    .select("id,content,kind,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("list memories:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id as string,
    content: r.content as string,
    kind: (r.kind as string) || "עובדה",
    createdAt: r.created_at as string,
  }));
}

export async function addMemory(
  content: string,
  kind: string,
  conversationId?: string
): Promise<void> {
  const { error } = await supabase.from("agent_memory").insert({
    id: `mem_${uid()}`,
    content,
    kind,
    source_conversation_id: conversationId ?? null,
  });
  if (error) console.error("add memory:", error.message);
}

export async function deleteMemory(id: string): Promise<void> {
  const { error } = await supabase.from("agent_memory").delete().eq("id", id);
  if (error) console.error("delete memory:", error.message);
}
