"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  matchConferences,
  selectVenue,
  type MatchConferencesData,
} from "@/app/dashboard/conferences/actions";
import type { PaperSessionRow } from "@/lib/action-result";
import { SessionSelect } from "@/components/dashboard/SessionSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ConferenceMatchForm({
  sessions,
}: {
  sessions: Array<Pick<PaperSessionRow, "id" | "idea_text" | "uniqueness_score" | "updated_at" | "selected_venue">>;
}) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const [result, setResult] = useState<MatchConferencesData | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentSelected = useMemo(() => {
    const s = sessions.find((x) => x.id === sessionId);
    const venue = s?.selected_venue as { shortName?: string; id?: string } | null;
    return venue?.shortName ?? null;
  }, [sessions, sessionId]);

  function runMatch() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await matchConferences({ sessionId });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setResult(response.data);
      setSelectedId(response.data.meta.primaryVenueId);
    });
  }

  function saveVenue(venueId: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await selectVenue({ sessionId, venueId });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setSelectedId(venueId);
      setMessage(`Saved ${response.data.venue.shortName} on this session. Continue to Outline builder.`);
    });
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Score an idea in{" "}
        <Link href="/dashboard/uniqueness" className="text-[hsl(var(--accent))] hover:underline">
          Uniqueness
        </Link>{" "}
        first, then return here to match venues.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SessionSelect
        sessions={sessions}
        value={sessionId}
        onChange={(id) => {
          setSessionId(id);
          setResult(null);
          setMessage(null);
        }}
        disabled={isPending}
      />

      {currentSelected && (
        <p className="text-sm text-muted-foreground">
          Currently saved venue on this session: <span className="text-foreground">{currentSelected}</span>
        </p>
      )}

      <Button onClick={runMatch} disabled={isPending || !sessionId}>
        {isPending && !result ? "Matching…" : "Match conferences"}
      </Button>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-400">{message}</p>}

      {result && (
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-medium text-foreground">Recommended path</h2>
            {result.metaDegraded && (
              <p className="mt-2 text-sm text-yellow-200/90">
                AI path suggestion degraded — using embedding ranks with a conservative fallback.
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">{result.meta.rationale}</p>
            <p className="mt-2 text-sm text-muted-foreground">{result.meta.studentAdvice}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge>Primary: {result.meta.primaryVenueId}</Badge>
              <Badge variant="secondary">Fallback: {result.meta.fallbackVenueId}</Badge>
            </div>
          </Card>

          <div className="grid gap-3">
            {result.ranked.map((venue) => {
              const isPrimary = venue.id === result.meta.primaryVenueId;
              const isFallback = venue.id === result.meta.fallbackVenueId;
              return (
                <Card key={venue.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-foreground">{venue.shortName}</h3>
                        <Badge variant="outline">{venue.tier}</Badge>
                        {isPrimary && <Badge className="bg-green-500/15 text-green-400">Primary</Badge>}
                        {isFallback && <Badge className="bg-yellow-500/15 text-yellow-400">Fallback</Badge>}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {venue.field} · fit {Math.round(venue.topicFit * 100)}% · acceptance ≈
                        {venue.acceptanceRate}% · difficulty {venue.difficulty}/5 · deadline{" "}
                        {venue.deadline}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{venue.topicDescription}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={venue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[hsl(var(--accent))] hover:underline"
                      >
                        Site <ExternalLink className="h-3 w-3" />
                      </Link>
                      <Button
                        size="sm"
                        variant={selectedId === venue.id ? "default" : "outline"}
                        disabled={isPending}
                        onClick={() => saveVenue(venue.id)}
                      >
                        {selectedId === venue.id ? "Selected" : "Select"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
