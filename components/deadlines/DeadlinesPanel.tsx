"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { acknowledgeMilestone } from "@/app/dashboard/deadlines/actions";
import type { PaperSessionRow } from "@/lib/action-result";
import type { ConferenceVenue } from "@/lib/conferences/venues";
import { SessionSelect } from "@/components/dashboard/SessionSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MILESTONES = [
  { id: "d30", daysBefore: 30, label: "30 days out — lock venue + outline" },
  { id: "d14", daysBefore: 14, label: "14 days out — finish core sections" },
  { id: "d7", daysBefore: 7, label: "7 days out — readiness check + polish" },
  { id: "d1", daysBefore: 1, label: "1 day out — final PDF + submit" },
];

function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T23:59:59Z`).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function DeadlinesPanel({
  sessions,
}: {
  sessions: Array<
    Pick<
      PaperSessionRow,
      "id" | "idea_text" | "uniqueness_score" | "updated_at" | "selected_venue" | "deadline_tracking"
    >
  >;
}) {
  const withVenue = sessions.filter((s) => Boolean(s.selected_venue));
  const [sessionId, setSessionId] = useState(withVenue[0]?.id ?? sessions[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [acked, setAcked] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();

  const session = sessions.find((s) => s.id === sessionId);
  const venue = session?.selected_venue as ConferenceVenue | null;
  const tracking = (session?.deadline_tracking ?? {}) as {
    deadline?: string;
    acknowledgedMilestones?: string[];
  };

  const deadline = venue?.deadline ?? tracking.deadline;
  const remaining = deadline ? daysUntil(deadline) : null;

  const activeMilestones = useMemo(() => {
    const acknowledged = acked ?? tracking.acknowledgedMilestones ?? [];
    if (remaining === null) return [];
    return MILESTONES.map((m) => ({
      ...m,
      due: remaining <= m.daysBefore,
      acknowledged: acknowledged.includes(m.id),
    }));
  }, [remaining, acked, tracking.acknowledgedMilestones]);

  function ack(milestoneId: string) {
    setError(null);
    startTransition(async () => {
      const response = await acknowledgeMilestone({ sessionId, milestoneId });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setAcked(response.data.acknowledgedMilestones);
    });
  }

  if (sessions.length === 0 || withVenue.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Select a venue in{" "}
        <Link href="/dashboard/conferences" className="text-[hsl(var(--accent))] hover:underline">
          Conference matching
        </Link>{" "}
        to start deadline tracking. Email/Calendar reminders via Composio are planned later — for now
        milestones live in-app.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SessionSelect
        sessions={withVenue}
        value={sessionId}
        onChange={(id) => {
          setSessionId(id);
          setAcked(null);
        }}
        disabled={isPending}
      />

      {venue && deadline && (
        <Card className="p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">{venue.shortName} deadline</p>
              <p className="text-3xl font-bold text-foreground">{deadline}</p>
            </div>
            <Badge
              className={
                remaining !== null && remaining < 0
                  ? "text-red-400"
                  : remaining !== null && remaining <= 7
                    ? "text-yellow-400"
                    : "text-green-400"
              }
            >
              {remaining === null
                ? "—"
                : remaining < 0
                  ? `${Math.abs(remaining)} days past`
                  : `${remaining} days left`}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            In-app milestones only for now (Composio Gmail/Calendar wiring comes later).
          </p>
        </Card>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="space-y-3">
        {activeMilestones.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">
                  {m.due ? "Active for your timeline" : `Triggers when ≤ ${m.daysBefore} days remain`}
                </p>
              </div>
              {m.acknowledged ? (
                <Badge className="text-green-400">Acknowledged</Badge>
              ) : (
                <Button size="sm" variant="outline" disabled={isPending || !m.due} onClick={() => ack(m.id)}>
                  Mark done
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
