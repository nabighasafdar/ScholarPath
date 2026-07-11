"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { runReadinessCheck, type RunReadinessData } from "@/app/dashboard/readiness/actions";
import type { PaperSessionRow } from "@/lib/action-result";
import type { ConferenceVenue } from "@/lib/conferences/venues";
import type { ReadinessReport } from "@/lib/readiness/assess";
import { SessionSelect } from "@/components/dashboard/SessionSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  pass: "text-success",
  warn: "text-warning",
  fail: "text-danger",
};

function readinessFromSession(
  session?: Pick<PaperSessionRow, "id" | "readiness" | "selected_venue"> | null
): RunReadinessData | null {
  if (!session?.readiness || typeof session.readiness !== "object") return null;
  const raw = session.readiness as ReadinessReport & { degraded?: boolean };
  if (!raw.checklist || typeof raw.score !== "number") return null;
  const venue = session.selected_venue as ConferenceVenue | null;
  return {
    sessionId: session.id,
    report: {
      score: raw.score,
      summary: raw.summary,
      checklist: raw.checklist,
      nextActions: raw.nextActions ?? [],
    },
    degraded: Boolean(raw.degraded),
    venueName: venue?.shortName ?? venue?.name ?? "Venue",
  };
}

export function ReadinessForm({
  sessions,
}: {
  sessions: Array<
    Pick<
      PaperSessionRow,
      "id" | "idea_text" | "uniqueness_score" | "updated_at" | "selected_venue" | "readiness"
    >
  >;
}) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const selected = useMemo(
    () => sessions.find((s) => s.id === sessionId),
    [sessions, sessionId]
  );
  const [draftNotes, setDraftNotes] = useState("");
  const [result, setResult] = useState<RunReadinessData | null>(() =>
    readinessFromSession(selected)
  );
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  function onSessionChange(id: string) {
    setSessionId(id);
    setError(null);
    setChecked({});
    setResult(readinessFromSession(sessions.find((s) => s.id === id)));
  }

  function run() {
    setError(null);
    startTransition(async () => {
      const response = await runReadinessCheck({ sessionId, draftNotes: draftNotes || undefined });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setResult(response.data);
      setChecked({});
    });
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Need a session + venue. Start at{" "}
        <Link href="/dashboard/uniqueness" className="text-[hsl(var(--accent))] hover:underline">
          Uniqueness
        </Link>
        .
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SessionSelect sessions={sessions} value={sessionId} onChange={onSessionChange} disabled={isPending} />
      <div className="space-y-2">
        <Label htmlFor="notes">Optional draft status notes</Label>
        <Textarea
          id="notes"
          value={draftNotes}
          onChange={(e) => setDraftNotes(e.target.value)}
          placeholder="e.g. Abstract + method drafted; experiments incomplete; figures missing captions…"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Status summary only (not the full paper). {draftNotes.length.toLocaleString()} / 12,000
          characters.
        </p>
      </div>
      <Button onClick={run} disabled={isPending || !sessionId}>
        {isPending ? "Checking…" : result ? "Re-run readiness check" : "Run readiness check"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Readiness · {result.venueName}</p>
                <p className="text-4xl font-bold">{result.report.score}/100</p>
              </div>
              {result.degraded && <Badge className="text-warning">Degraded</Badge>}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{result.report.summary}</p>
          </Card>

          <div className="space-y-2">
            {result.report.checklist.map((item) => (
              <Card key={item.id} className="p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    className="mt-1"
                    checked={Boolean(checked[item.id])}
                    onCheckedChange={(v) =>
                      setChecked((prev) => ({ ...prev, [item.id]: v === true }))
                    }
                  />
                  <span>
                    <span className="font-medium text-foreground">{item.label}</span>{" "}
                    <span className={cn("text-xs uppercase", STATUS_STYLE[item.status])}>
                      {item.status}
                    </span>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                  </span>
                </label>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <h3 className="font-medium">Next actions</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {result.report.nextActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
