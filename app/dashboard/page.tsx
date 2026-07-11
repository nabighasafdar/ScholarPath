import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboardStats } from "@/lib/dashboard/stats";
import { getUpcomingDeadlines } from "@/lib/conferences/upcoming";
import { FALLBACK_TOPICS } from "@/lib/dashboard/topicSuggestions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/dashboard/StatTile";
import { ScoreTrendChart } from "@/components/dashboard/ScoreTrendChart";
import { PipelineProgress } from "@/components/dashboard/PipelineProgress";
import { TopicSuggestions } from "@/components/dashboard/TopicSuggestions";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";

function scoreTone(score: number | null): "default" | "success" | "warning" | "danger" {
  if (score === null) return "default";
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  return "danger";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const stats = await getDashboardStats(user.id);
  const upcomingVenues = getUpcomingDeadlines(4);
  const hasSessions = stats.totalSessions > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Full pipeline is live — start with uniqueness, then work through venues, outline,
        coaching, readiness, and deadlines.
      </p>

      {!hasSessions ? (
        <Card className="mt-8 flex flex-col items-start gap-4 p-8">
          <Badge>Get started</Badge>
          <div>
            <h2 className="font-medium text-foreground">Score your first idea</h2>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
              Once you run a uniqueness score, your session count, score trend, and pipeline
              progress will show up here.
            </p>
          </div>
          <Link href="/dashboard/uniqueness" className="inline-flex">
            <Button>Score an idea</Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Research sessions" value={String(stats.totalSessions)} />
            <StatTile label="Score attempts" value={String(stats.totalAttempts)} />
            <StatTile
              label="Average score"
              value={stats.averageScore !== null ? String(stats.averageScore) : "—"}
              tone={scoreTone(stats.averageScore)}
            />
            <StatTile
              label="Best score"
              value={stats.bestScore !== null ? String(stats.bestScore) : "—"}
              hint={stats.bestScore !== null ? "out of 100" : undefined}
              tone={scoreTone(stats.bestScore)}
            />
          </div>

          <div className="mt-4">
            <Card className="p-5">
              <h2 className="text-sm font-medium text-foreground">Score attempts over time</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Dashed lines mark the publish-worthy (70) and iterate (40) thresholds.
              </p>
              <div className="mt-4">
                {stats.scoreTrend.length > 1 ? (
                  <ScoreTrendChart data={stats.scoreTrend} />
                ) : (
                  <p className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    Score another idea to see a trend.
                  </p>
                )}
              </div>
            </Card>
          </div>

          <div className="mt-4">
            <PipelineProgress actions={stats.completedActions} />
          </div>
        </>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TopicSuggestions initialTopics={FALLBACK_TOPICS} initialDegraded />
        </div>
        <div className="lg:col-span-2">
          <UpcomingDeadlines venues={upcomingVenues} />
        </div>
      </div>
    </div>
  );
}
