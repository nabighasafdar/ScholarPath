"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser, getSessionForUser, touchSession } from "@/lib/sessions";
import { coachSection, SECTION_TYPES, type CoachingFeedback } from "@/lib/coaching/coach";
import type { CandidatePaper } from "@/lib/uniqueness/types";
import type { ConferenceVenue } from "@/lib/conferences/venues";

const inputSchema = z.object({
  sessionId: z.string().uuid(),
  sectionType: z.enum(SECTION_TYPES),
  draft: z.string().trim().min(40).max(12000),
});

export type CoachSectionData = {
  sessionId: string;
  sectionType: string;
  feedback: CoachingFeedback;
  citationCandidates: CandidatePaper[];
  degraded: boolean;
  warnings: string[];
};

export async function runSectionCoaching(input: {
  sessionId: string;
  sectionType: (typeof SECTION_TYPES)[number];
  draft: string;
}): Promise<ActionResult<CoachSectionData>> {
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
      return { ok: false, error: { code: "unauthorized", message: "Sign in for section coaching." } };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const venue = session.selected_venue as ConferenceVenue | null;
    const { feedback, citationCandidates, degraded, warnings } = await coachSection({
      ideaText: session.idea_text,
      sectionType: parsed.data.sectionType,
      draft: parsed.data.draft,
      venueName: venue?.shortName,
    });

    const entry = {
      sectionType: parsed.data.sectionType,
      draftPreview: parsed.data.draft.slice(0, 280),
      feedback,
      citationCandidates,
      degraded,
      warnings,
      createdAt: new Date().toISOString(),
    };

    const prior = Array.isArray(session.section_feedback)
      ? (session.section_feedback as unknown[])
      : [];

    const { error } = await touchSession(session.id, user.id, {
      section_feedback: [...prior, entry].slice(-20),
      status: "coaching",
    });

    if (error) {
      console.error("[coaching] persist failed:", error);
      return { ok: false, error: { code: "db_error", message: "Could not save coaching result." } };
    }

    return {
      ok: true,
      data: {
        sessionId: session.id,
        sectionType: parsed.data.sectionType,
        feedback,
        citationCandidates,
        degraded,
        warnings,
      },
    };
  } catch (err) {
    console.error("[coaching] runSectionCoaching failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Coaching failed. Try again." },
    };
  }
}
