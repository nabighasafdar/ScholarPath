"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser, getSessionForUser, touchSession } from "@/lib/sessions";
import { generateOutline, type PaperOutline } from "@/lib/outline/generate";
import type { ConferenceVenue } from "@/lib/conferences/venues";

const inputSchema = z.object({
  sessionId: z.string().uuid(),
});

export type BuildOutlineData = {
  sessionId: string;
  outline: PaperOutline;
  degraded: boolean;
  venueName: string;
};

const saveSchema = z.object({
  sessionId: z.string().uuid(),
  outline: z.object({
    titleSuggestion: z.string().min(1),
    citationStyle: z.string().min(1),
    pageBudget: z.string().min(1),
    sections: z.array(
      z.object({
        name: z.string(),
        purpose: z.string(),
        targetWords: z.number().int().positive(),
        bullets: z.array(z.string()),
      })
    ),
    suggestedDatasets: z.array(z.string()),
    suggestedBaselines: z.array(z.string()),
    suggestedMetrics: z.array(z.string()),
    notes: z.string(),
  }),
});

export async function saveOutline(input: {
  sessionId: string;
  outline: PaperOutline;
}): Promise<ActionResult<BuildOutlineData>> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid outline." },
    };
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to save an outline." } };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const venue = session.selected_venue as ConferenceVenue | null;
    const { error } = await touchSession(session.id, user.id, {
      outline: {
        ...parsed.data.outline,
        generatedAt: new Date().toISOString(),
        degraded: false,
        edited: true,
      },
      status: "outline_ready",
    });

    if (error) {
      return { ok: false, error: { code: "db_error", message: "Could not save outline edits." } };
    }

    return {
      ok: true,
      data: {
        sessionId: session.id,
        outline: parsed.data.outline,
        degraded: false,
        venueName: venue?.shortName ?? venue?.name ?? "Venue",
      },
    };
  } catch (err) {
    console.error("[outline] saveOutline failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Could not save outline. Try again." },
    };
  }
}

export async function buildOutline(input: {
  sessionId: string;
}): Promise<ActionResult<BuildOutlineData>> {
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
      return { ok: false, error: { code: "unauthorized", message: "Sign in to build an outline." } };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const venue = session.selected_venue as ConferenceVenue | null;
    if (!venue?.id) {
      return {
        ok: false,
        error: {
          code: "precondition",
          message: "Select a conference venue first in Conference matching.",
        },
      };
    }

    const { outline, degraded } = await generateOutline({
      ideaText: session.idea_text,
      venue,
    });

    const { error } = await touchSession(session.id, user.id, {
      outline: { ...outline, generatedAt: new Date().toISOString(), degraded },
      status: "outline_ready",
    });

    if (error) {
      console.error("[outline] persist failed:", error);
      return { ok: false, error: { code: "db_error", message: "Could not save outline." } };
    }

    return {
      ok: true,
      data: {
        sessionId: session.id,
        outline,
        degraded,
        venueName: venue.shortName ?? venue.name,
      },
    };
  } catch (err) {
    console.error("[outline] buildOutline failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Could not build outline. Try again." },
    };
  }
}
