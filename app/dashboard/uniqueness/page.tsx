import { listSessionsForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import { DashboardModuleShell } from "@/components/dashboard/DashboardModuleShell";
import { UniquenessForm } from "@/components/uniqueness/UniquenessForm";
import type { ScoreIdeaData } from "@/lib/uniqueness/types";

async function loadLatestAttempt(
  sessionId: string,
  userId: string
): Promise<ScoreIdeaData | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("score_attempts")
    .select("id, score, explanation, created_at, session_id")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const explanation = (data.explanation ?? {}) as Record<string, unknown>;
  const meta = (explanation.meta ?? {}) as Record<string, unknown>;
  const candidates = Array.isArray(explanation.candidates)
    ? (explanation.candidates as ScoreIdeaData["topCandidates"])
    : [];

  const score = data.score as number;
  const bucket = score >= 70 ? "green" : score >= 40 ? "yellow" : "red";

  return {
    sessionId: data.session_id as string,
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

export default async function UniquenessPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Layout already redirects, but keep a narrow guard for typing.
  if (!user) return null;

  const sessions = await listSessionsForUser(user.id);
  const initialSession = sessions[0] ?? null;
  const initialResult = initialSession
    ? await loadLatestAttempt(initialSession.id, user.id)
    : null;

  const attemptRows =
    initialSession != null
      ? (
          await supabase
            .from("score_attempts")
            .select("id, score, created_at")
            .eq("session_id", initialSession.id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10)
        ).data ?? []
      : [];

  return (
    <DashboardModuleShell
      title="Uniqueness score"
      description="Live search against arXiv and Semantic Scholar, then embed + score with Pinecone."
    >
      <UniquenessForm
        sessions={sessions}
        initialSessionId={initialSession?.id}
        initialIdeaText={initialSession?.idea_text ?? ""}
        initialResult={initialResult}
        initialAttempts={attemptRows.map((a) => ({
          id: a.id as string,
          score: a.score as number,
          createdAt: a.created_at as string,
        }))}
      />
    </DashboardModuleShell>
  );
}
