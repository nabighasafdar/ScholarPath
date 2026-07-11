"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser, getSessionForUser, touchSession } from "@/lib/sessions";
import {
  adjustForStudentPath,
  rankVenuesByTopic,
  suggestMatchPath,
  type RankedVenue,
  type MatchMeta,
} from "@/lib/conferences/match";
import { getVenueById, type ConferenceVenue } from "@/lib/conferences/venues";

const matchInputSchema = z.object({
  sessionId: z.string().uuid(),
});

const selectInputSchema = z.object({
  sessionId: z.string().uuid(),
  venueId: z.string().min(1),
});

export type MatchConferencesData = {
  sessionId: string;
  ideaText: string;
  ranked: RankedVenue[];
  meta: MatchMeta;
  metaDegraded: boolean;
};

export type SelectVenueData = {
  sessionId: string;
  venue: ConferenceVenue;
};

export async function matchConferences(input: {
  sessionId: string;
}): Promise<ActionResult<MatchConferencesData>> {
  const parsed = matchInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to match conferences." } };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const rankedRaw = await rankVenuesByTopic(session.idea_text);
    const ranked = adjustForStudentPath(rankedRaw).slice(0, 10);
    const { meta, degraded } = await suggestMatchPath(session.idea_text, ranked);

    return {
      ok: true,
      data: {
        sessionId: session.id,
        ideaText: session.idea_text,
        ranked,
        meta,
        metaDegraded: degraded,
      },
    };
  } catch (err) {
    console.error("[conferences] matchConferences failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Could not match conferences. Try again." },
    };
  }
}

export async function selectVenue(input: {
  sessionId: string;
  venueId: string;
}): Promise<ActionResult<SelectVenueData>> {
  const parsed = selectInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to select a venue." } };
    }

    const venue = getVenueById(parsed.data.venueId);
    if (!venue) {
      return { ok: false, error: { code: "not_found", message: "Unknown venue." } };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const payload = {
      ...venue,
      selectedAt: new Date().toISOString(),
    };

    const { error } = await touchSession(session.id, user.id, {
      selected_venue: payload,
      status: "venue_selected",
      deadline_tracking: {
        venueId: venue.id,
        deadline: venue.deadline,
        acknowledgedMilestones: [],
      },
    });

    if (error) {
      console.error("[conferences] selectVenue persist failed:", error);
      return { ok: false, error: { code: "db_error", message: "Could not save venue selection." } };
    }

    return { ok: true, data: { sessionId: session.id, venue } };
  } catch (err) {
    console.error("[conferences] selectVenue failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Could not save venue. Try again." },
    };
  }
}
