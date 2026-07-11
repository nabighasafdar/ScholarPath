"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser, getSessionForUser, touchSession } from "@/lib/sessions";
import { assessReadiness, type ReadinessReport } from "@/lib/readiness/assess";
import type { ConferenceVenue } from "@/lib/conferences/venues";
import type { PaperOutline } from "@/lib/outline/generate";

const DRAFT_NOTES_MAX = 12_000;

const inputSchema = z.object({
  sessionId: z.string().uuid({ message: "Pick a paper session before running readiness." }),
  draftNotes: z
    .string()
    .max(
      DRAFT_NOTES_MAX,
      `Draft notes are too long (max ${DRAFT_NOTES_MAX.toLocaleString()} characters). Paste a short status summary, not the full paper.`
    )
    .optional(),
});

export type RunReadinessData = {
  sessionId: string;
  report: ReadinessReport;
  degraded: boolean;
  venueName: string;
};

export async function runReadinessCheck(input: {
  sessionId: string;
  draftNotes?: string;
}): Promise<ActionResult<RunReadinessData>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: issue?.message ?? "Invalid input.",
      },
    };
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in for readiness checks." } };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const venue = session.selected_venue as ConferenceVenue | null;
    if (!venue?.id) {
      return {
        ok: false,
        error: { code: "precondition", message: "Select a venue before running readiness." },
      };
    }

    const outline = (session.outline as PaperOutline | null) ?? null;
    const { report, degraded } = await assessReadiness({
      ideaText: session.idea_text,
      venue,
      outline,
      draftNotes: parsed.data.draftNotes,
    });

    const { error } = await touchSession(session.id, user.id, {
      readiness: { ...report, degraded, checkedAt: new Date().toISOString() },
      status: "readiness_checked",
    });

    if (error) {
      console.error("[readiness] persist failed:", error);
      return { ok: false, error: { code: "db_error", message: "Could not save readiness report." } };
    }

    return {
      ok: true,
      data: {
        sessionId: session.id,
        report,
        degraded,
        venueName: venue.shortName ?? venue.name,
      },
    };
  } catch (err) {
    console.error("[readiness] runReadinessCheck failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Readiness check failed. Try again." },
    };
  }
}
