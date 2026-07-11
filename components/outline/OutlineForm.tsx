"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  buildOutline,
  saveOutline,
  type BuildOutlineData,
} from "@/app/dashboard/outline/actions";
import type { PaperOutline } from "@/lib/outline/generate";
import type { PaperSessionRow } from "@/lib/action-result";
import type { ConferenceVenue } from "@/lib/conferences/venues";
import { SessionSelect } from "@/components/dashboard/SessionSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function outlineFromSession(session?: PaperSessionRow | null): BuildOutlineData | null {
  if (!session?.outline || typeof session.outline !== "object") return null;
  const raw = session.outline as PaperOutline & { degraded?: boolean };
  if (!raw.sections || !raw.titleSuggestion) return null;
  const venue = session.selected_venue as ConferenceVenue | null;
  return {
    sessionId: session.id,
    outline: {
      titleSuggestion: raw.titleSuggestion,
      citationStyle: raw.citationStyle,
      pageBudget: raw.pageBudget,
      sections: raw.sections,
      suggestedDatasets: raw.suggestedDatasets ?? [],
      suggestedBaselines: raw.suggestedBaselines ?? [],
      suggestedMetrics: raw.suggestedMetrics ?? [],
      notes: raw.notes ?? "",
    },
    degraded: Boolean(raw.degraded),
    venueName: venue?.shortName ?? venue?.name ?? "Venue",
  };
}

export function OutlineForm({
  sessions,
}: {
  sessions: Array<
    Pick<
      PaperSessionRow,
      "id" | "idea_text" | "uniqueness_score" | "updated_at" | "selected_venue" | "outline"
    >
  >;
}) {
  const withVenue = sessions.filter((s) => Boolean(s.selected_venue));
  const [sessionId, setSessionId] = useState(withVenue[0]?.id ?? sessions[0]?.id ?? "");
  const selected = useMemo(
    () => sessions.find((s) => s.id === sessionId) ?? null,
    [sessions, sessionId]
  );
  const [result, setResult] = useState<BuildOutlineData | null>(() =>
    outlineFromSession(selected as PaperSessionRow | null)
  );
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSessionChange(id: string) {
    setSessionId(id);
    setError(null);
    setMessage(null);
    const next = sessions.find((s) => s.id === id) ?? null;
    setResult(outlineFromSession(next as PaperSessionRow | null));
  }

  function run() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await buildOutline({ sessionId });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setResult(response.data);
    });
  }

  function updateOutline(patch: Partial<PaperOutline>) {
    if (!result) return;
    setResult({ ...result, outline: { ...result.outline, ...patch } });
  }

  function updateSection(index: number, patch: Partial<PaperOutline["sections"][number]>) {
    if (!result) return;
    const sections = result.outline.sections.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setResult({ ...result, outline: { ...result.outline, sections } });
  }

  function saveEdits() {
    if (!result) return;
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const response = await saveOutline({ sessionId, outline: result.outline });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setResult(response.data);
      setMessage("Outline saved.");
    });
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Start with{" "}
        <Link href="/dashboard/uniqueness" className="text-[hsl(var(--accent))] hover:underline">
          Uniqueness
        </Link>{" "}
        and{" "}
        <Link href="/dashboard/conferences" className="text-[hsl(var(--accent))] hover:underline">
          Conference matching
        </Link>
        .
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SessionSelect
        sessions={sessions}
        value={sessionId}
        onChange={onSessionChange}
        disabled={isPending}
      />
      <div className="flex flex-wrap gap-2">
        <Button onClick={run} disabled={isPending || !sessionId}>
          {isPending ? "Working…" : result ? "Regenerate outline" : "Generate outline"}
        </Button>
        {result && (
          <Button variant="outline" onClick={saveEdits} disabled={isPending}>
            Save edits
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-400">{message}</p>}

      {result && (
        <div className="space-y-4">
          <Card className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{result.venueName}</Badge>
              {result.degraded && <Badge className="text-yellow-400">Template fallback</Badge>}
            </div>
            <Input
              value={result.outline.titleSuggestion}
              onChange={(e) => updateOutline({ titleSuggestion: e.target.value })}
              disabled={isPending}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={result.outline.citationStyle}
                onChange={(e) => updateOutline({ citationStyle: e.target.value })}
                disabled={isPending}
                placeholder="Citation style"
              />
              <Input
                value={result.outline.pageBudget}
                onChange={(e) => updateOutline({ pageBudget: e.target.value })}
                disabled={isPending}
                placeholder="Page budget"
              />
            </div>
            <Textarea
              value={result.outline.notes}
              onChange={(e) => updateOutline({ notes: e.target.value })}
              disabled={isPending}
              placeholder="Notes"
            />
          </Card>

          {result.outline.sections.map((section, index) => (
            <Card key={`${section.name}-${index}`} className="space-y-2 p-4">
              <Input
                value={section.name}
                onChange={(e) => updateSection(index, { name: e.target.value })}
                disabled={isPending}
              />
              <Textarea
                value={section.purpose}
                onChange={(e) => updateSection(index, { purpose: e.target.value })}
                disabled={isPending}
              />
              <Input
                type="number"
                value={section.targetWords}
                onChange={(e) =>
                  updateSection(index, { targetWords: Number(e.target.value) || 1 })
                }
                disabled={isPending}
              />
              <Textarea
                value={section.bullets.join("\n")}
                onChange={(e) =>
                  updateSection(index, {
                    bullets: e.target.value
                      .split("\n")
                      .map((b) => b.trim())
                      .filter(Boolean),
                  })
                }
                disabled={isPending}
                placeholder="One bullet per line"
              />
            </Card>
          ))}

          <div className="grid gap-3 md:grid-cols-3">
            {(
              [
                ["suggestedDatasets", "Datasets"],
                ["suggestedBaselines", "Baselines"],
                ["suggestedMetrics", "Metrics"],
              ] as const
            ).map(([key, label]) => (
              <Card key={key} className="space-y-2 p-4">
                <h3 className="text-sm font-medium">{label}</h3>
                <Textarea
                  value={result.outline[key].join("\n")}
                  onChange={(e) =>
                    updateOutline({
                      [key]: e.target.value
                        .split("\n")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    })
                  }
                  disabled={isPending}
                  placeholder="One item per line"
                />
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
