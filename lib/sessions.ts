import { createClient } from "@/lib/supabase/server";
import type { PaperSessionRow } from "@/lib/action-result";

export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getSessionForUser(
  sessionId: string,
  userId: string
): Promise<PaperSessionRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("paper_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[sessions] getSessionForUser failed:", error);
    return null;
  }
  return data as PaperSessionRow | null;
}

export async function listSessionsForUser(userId: string): Promise<PaperSessionRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("paper_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[sessions] listSessionsForUser failed:", error);
    return [];
  }
  return (data ?? []) as PaperSessionRow[];
}

export async function touchSession(
  sessionId: string,
  userId: string,
  patch: Record<string, unknown>
) {
  const supabase = createClient();
  return supabase
    .from("paper_sessions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", userId)
    .select("*")
    .single();
}
