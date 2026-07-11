"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { searchCandidates } from "@/lib/uniqueness/search";
import { embedTexts } from "@/lib/uniqueness/embed";
import { computeUniquenessScore } from "@/lib/uniqueness/score";
import { explainUniqueness } from "@/lib/uniqueness/explain";
import type { ActionResult, ScoreIdeaData } from "@/lib/uniqueness/types";
import { requireUser } from "@/lib/sessions";

const inputSchema = z.object({
  ideaText: z
    .string()
    .trim()
    .min(20, "Idea must be at least 20 characters.")
    .max(2000, "Idea must be at most 2000 characters."),
  sessionId: z.string().uuid().optional(),
});

function attemptToScoreData(
  sessionId: string,
  score: number,
  explanationRaw: unknown
): ScoreIdeaData {
  const explanation = (explanationRaw ?? {}) as Record<string, unknown>;
  const meta = (explanation.meta ?? {}) as Record<string, unknown>;
  const candidates = Array.isArray(explanation.candidates)
    ? (explanation.candidates as ScoreIdeaData["topCandidates"])
    : [];
  const bucket = score >= 70 ? "green" : score >= 40 ? "yellow" : "red";

  return {
    sessionId,
    score,
    bucket,
    corpusEmpty: Boolean(meta.corpusEmpty),
    explanationDegraded: Boolean(meta.explanationDegraded),
    warnings: Array.isArray(meta.warnings) ? (meta.warnings as string[]) : [],
    topCandidates: candidates,
    explanation: {
      overlaps: Array.isArray(explanation.overlaps) ? (explanation.overlaps as string[]) : [],
      novelAspects: Array.isArray(explanation.novelAspects)
        ? (explanation.novelAspects as string[])
        : [],
      plagiarismRisk:
        explanation.plagiarismRisk === "medium" || explanation.plagiarismRisk === "high"
          ? explanation.plagiarismRisk
          : "low",
      suggestion: typeof explanation.suggestion === "string" ? explanation.suggestion : "",
    },
  };
}

export type ScoreAttemptSummary = {
  id: string;
  score: number;
  createdAt: string;
};

export async function loadSessionScoreHistory(input: {
  sessionId: string;
}): Promise<
  ActionResult<{
    ideaText: string;
    latest: ScoreIdeaData | null;
    attempts: ScoreAttemptSummary[];
  }>
> {
  const parsed = z.object({ sessionId: z.string().uuid() }).safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: "Invalid session id." },
    };
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in required." } };
    }

    const supabase = createClient();
    const { data: session } = await supabase
      .from("paper_sessions")
      .select("id, idea_text")
      .eq("id", parsed.data.sessionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Session not found." } };
    }

    const { data: attempts } = await supabase
      .from("score_attempts")
      .select("id, score, explanation, created_at")
      .eq("session_id", session.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const rows = attempts ?? [];
    const latestRow = rows[0];

    return {
      ok: true,
      data: {
        ideaText: session.idea_text as string,
        latest: latestRow
          ? attemptToScoreData(session.id as string, latestRow.score as number, latestRow.explanation)
          : null,
        attempts: rows.map((a) => ({
          id: a.id as string,
          score: a.score as number,
          createdAt: a.created_at as string,
        })),
      },
    };
  } catch (err) {
    console.error("[uniqueness] loadSessionScoreHistory failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Could not load score history." },
    };
  }
}

export async function scoreIdea(input: {
  ideaText: string;
  sessionId?: string;
}): Promise<ActionResult<ScoreIdeaData>> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: parsed.error.issues[0]?.message ?? "Invalid input.",
      },
    };
  }

  const { ideaText, sessionId } = parsed.data;

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        error: { code: "unauthorized", message: "Sign in to score an idea." },
      };
    }

    const { candidates, warnings } = await searchCandidates(ideaText);

    let scoreResult = computeUniquenessScore([], candidates, []);
    if (candidates.length > 0) {
      const vectors = await embedTexts([ideaText, ...candidates.map((c) => c.abstract)]);
      const [ideaVector, ...candidateVectors] = vectors;
      scoreResult = computeUniquenessScore(ideaVector, candidates, candidateVectors);
    }

    const { explanation, explanationDegraded } = await explainUniqueness({
      ideaText,
      score: scoreResult.score,
      bucket: scoreResult.bucket,
      topCandidates: scoreResult.topCandidates,
      corpusEmpty: scoreResult.corpusEmpty,
    });

    const explanationPayload = {
      ...explanation,
      candidates: scoreResult.topCandidates,
      meta: {
        corpusEmpty: scoreResult.corpusEmpty,
        explanationDegraded,
        warnings,
      },
    };

    const now = new Date().toISOString();
    let activeSessionId = sessionId;

    if (activeSessionId) {
      const { data: existing, error: existingError } = await supabase
        .from("paper_sessions")
        .select("id")
        .eq("id", activeSessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingError) {
        console.error("[uniqueness] session lookup failed:", existingError);
        return {
          ok: false,
          error: { code: "db_error", message: "Could not load your paper session." },
        };
      }

      if (!existing) {
        activeSessionId = undefined;
      } else {
        const { error: updateError } = await supabase
          .from("paper_sessions")
          .update({
            idea_text: ideaText,
            uniqueness_score: scoreResult.score,
            status: "scored",
            updated_at: now,
          })
          .eq("id", activeSessionId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("[uniqueness] session update failed:", updateError);
          return {
            ok: false,
            error: { code: "db_error", message: "Could not update your paper session." },
          };
        }
      }
    }

    if (!activeSessionId) {
      const { data: created, error: insertError } = await supabase
        .from("paper_sessions")
        .insert({
          user_id: user.id,
          idea_text: ideaText,
          uniqueness_score: scoreResult.score,
          status: "scored",
          updated_at: now,
        })
        .select("id")
        .single();

      if (insertError || !created) {
        console.error("[uniqueness] session insert failed:", insertError);
        return {
          ok: false,
          error: { code: "db_error", message: "Could not save your paper session." },
        };
      }
      activeSessionId = created.id;
    }

    if (!activeSessionId) {
      return {
        ok: false,
        error: { code: "db_error", message: "Could not resolve a paper session id." },
      };
    }

    const resolvedSessionId = activeSessionId;

    const { error: attemptError } = await supabase.from("score_attempts").insert({
      session_id: resolvedSessionId,
      user_id: user.id,
      score: scoreResult.score,
      explanation: explanationPayload,
    });

    if (attemptError) {
      console.error("[uniqueness] score_attempts insert failed:", attemptError);
      // Session already updated — return success with a warning rather than failing the score.
      warnings.push("Score saved on the session, but attempt history could not be recorded.");
    }

    return {
      ok: true,
      data: {
        sessionId: resolvedSessionId,
        score: scoreResult.score,
        bucket: scoreResult.bucket,
        corpusEmpty: scoreResult.corpusEmpty,
        explanationDegraded,
        warnings,
        topCandidates: scoreResult.topCandidates,
        explanation,
      },
    };
  } catch (err) {
    console.error("[uniqueness] scoreIdea failed:", err);
    return {
      ok: false,
      error: {
        code: "internal_error",
        message: "Something went wrong while scoring. Please try again.",
      },
    };
  }
}
