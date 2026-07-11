"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser, getSessionForUser, touchSession } from "@/lib/sessions";

const inputSchema = z.object({
  sessionId: z.string().uuid(),
  milestoneId: z.string().min(1),
});

export type AckMilestoneData = {
  sessionId: string;
  acknowledgedMilestones: string[];
};

export async function acknowledgeMilestone(input: {
  sessionId: string;
  milestoneId: string;
}): Promise<ActionResult<AckMilestoneData>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to track deadlines." } };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const existing = (session.deadline_tracking ?? {}) as {
      venueId?: string;
      deadline?: string;
      acknowledgedMilestones?: string[];
    };

    const acknowledged = new Set(existing.acknowledgedMilestones ?? []);
    acknowledged.add(parsed.data.milestoneId);

    const next = {
      ...existing,
      acknowledgedMilestones: Array.from(acknowledged),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await touchSession(session.id, user.id, { deadline_tracking: next });
    if (error) {
      return { ok: false, error: { code: "db_error", message: "Could not save reminder state." } };
    }

    return {
      ok: true,
      data: { sessionId: session.id, acknowledgedMilestones: Array.from(acknowledged) },
    };
  } catch (err) {
    console.error("[deadlines] acknowledgeMilestone failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Could not update reminder. Try again." },
    };
  }
}
