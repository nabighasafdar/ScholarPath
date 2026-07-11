import { createClient } from "@/lib/supabase/server";

export type ScoreTrendPoint = { date: string; score: number; attempt: number };
export type CompletedAction = { key: string; label: string; count: number };

export type DashboardStats = {
  totalSessions: number;
  totalAttempts: number;
  averageScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  scoreTrend: ScoreTrendPoint[];
  completedActions: CompletedAction[];
};

const EMPTY_STATS: DashboardStats = {
  totalSessions: 0,
  totalAttempts: 0,
  averageScore: null,
  bestScore: null,
  latestScore: null,
  scoreTrend: [],
  completedActions: [],
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const supabase = createClient();

  const [sessionsRes, attemptsRes] = await Promise.all([
    supabase
      .from("paper_sessions")
      .select("selected_venue, outline, section_feedback, readiness, deadline_tracking")
      .eq("user_id", userId),
    supabase
      .from("score_attempts")
      .select("score, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(30),
  ]);

  if (sessionsRes.error) {
    console.error("[dashboard] stats: sessions query failed:", sessionsRes.error);
  }
  if (attemptsRes.error) {
    console.error("[dashboard] stats: score_attempts query failed:", attemptsRes.error);
  }

  const sessions = sessionsRes.data ?? [];
  const attempts = attemptsRes.data ?? [];

  if (sessionsRes.error && attemptsRes.error) {
    return EMPTY_STATS;
  }

  const scores = attempts.map((a) => a.score);
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : null;
  const bestScore = scores.length ? Math.max(...scores) : null;
  const latestScore = attempts.length ? attempts[attempts.length - 1].score : null;

  const scoreTrend = attempts.map((a, i) => ({
    date: new Date(a.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: a.score,
    attempt: i + 1,
  }));

  const completedActions: CompletedAction[] = [
    {
      key: "venues",
      label: "Venues matched",
      count: sessions.filter((s) => s.selected_venue != null).length,
    },
    {
      key: "outlines",
      label: "Outlines built",
      count: sessions.filter((s) => s.outline != null).length,
    },
    {
      key: "coaching",
      label: "Sections coached",
      count: sessions.filter((s) => Array.isArray(s.section_feedback) && s.section_feedback.length > 0)
        .length,
    },
    {
      key: "readiness",
      label: "Readiness checks",
      count: sessions.filter((s) => s.readiness != null).length,
    },
    {
      key: "deadlines",
      label: "Deadlines tracked",
      count: sessions.filter((s) => s.deadline_tracking != null).length,
    },
  ];

  return {
    totalSessions: sessions.length,
    totalAttempts: attempts.length,
    averageScore,
    bestScore,
    latestScore,
    scoreTrend,
    completedActions,
  };
}
