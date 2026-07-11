"use server";

import type { ActionResult } from "@/lib/action-result";
import { requireUser, listSessionsForUser } from "@/lib/sessions";
import { getSuggestedTopics, type TopicSuggestion } from "@/lib/dashboard/topicSuggestions";

export type SuggestTopicsData = { topics: TopicSuggestion[]; degraded: boolean };

export async function suggestTopics(): Promise<ActionResult<SuggestTopicsData>> {
  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to get suggestions." } };
    }

    const sessions = await listSessionsForUser(user.id);
    const recentIdeas = sessions.slice(0, 5).map((s) => s.idea_text);

    const { topics, degraded } = await getSuggestedTopics(recentIdeas);
    return { ok: true, data: { topics, degraded } };
  } catch (err) {
    console.error("[dashboard] suggestTopics failed:", err);
    return { ok: false, error: { code: "internal_error", message: "Could not generate suggestions." } };
  }
}
