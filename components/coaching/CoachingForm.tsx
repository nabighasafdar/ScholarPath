"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { runSectionCoaching, type CoachSectionData } from "@/app/dashboard/coaching/actions";
import { SECTION_TYPES } from "@/lib/coaching/coach";
import type { PaperSessionRow } from "@/lib/action-result";
import { SessionSelect } from "@/components/dashboard/SessionSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function latestCoaching(
  session?: Pick<PaperSessionRow, "id" | "section_feedback"> | null
): CoachSectionData | null {
  if (!session || !Array.isArray(session.section_feedback) || session.section_feedback.length === 0) {
    return null;
  }
  const last = session.section_feedback[session.section_feedback.length - 1] as Record<
    string,
    unknown
  >;
  if (!last?.feedback) return null;
  return {
    sessionId: session.id,
    sectionType: String(last.sectionType ?? "related_work"),
    feedback: last.feedback as CoachSectionData["feedback"],
    citationCandidates: Array.isArray(last.citationCandidates)
      ? (last.citationCandidates as CoachSectionData["citationCandidates"])
      : [],
    degraded: Boolean(last.degraded),
    warnings: Array.isArray(last.warnings) ? (last.warnings as string[]) : [],
  };
}

export function CoachingForm({
  sessions,
}: {
  sessions: Array<
    Pick<PaperSessionRow, "id" | "idea_text" | "uniqueness_score" | "updated_at" | "section_feedback">
  >;
}) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const selected = useMemo(
    () => sessions.find((s) => s.id === sessionId),
    [sessions, sessionId]
  );
  const hydrated = latestCoaching(selected);
  const [sectionType, setSectionType] = useState<(typeof SECTION_TYPES)[number]>(
    (hydrated?.sectionType as (typeof SECTION_TYPES)[number]) || "related_work"
  );
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<CoachSectionData | null>(hydrated);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSessionChange(id: string) {
    setSessionId(id);
    setError(null);
    const next = sessions.find((s) => s.id === id);
    const loaded = latestCoaching(next);
    setResult(loaded);
    if (loaded?.sectionType && SECTION_TYPES.includes(loaded.sectionType as (typeof SECTION_TYPES)[number])) {
      setSectionType(loaded.sectionType as (typeof SECTION_TYPES)[number]);
    }
  }

  function run() {
    setError(null);
    startTransition(async () => {
      const response = await runSectionCoaching({ sessionId, sectionType, draft });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setResult(response.data);
    });
  }

  if (sessions.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Create a session via{" "}
        <Link href="/dashboard/uniqueness" className="text-[hsl(var(--accent))] hover:underline">
          Uniqueness
        </Link>{" "}
        first.
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

      <div className="space-y-2">
        <Label htmlFor="section">Section</Label>
        <select
          id="section"
          className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          value={sectionType}
          onChange={(e) => setSectionType(e.target.value as (typeof SECTION_TYPES)[number])}
          disabled={isPending}
        >
          {SECTION_TYPES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="draft">Paste your draft (coaching only — we won’t rewrite it for you)</Label>
        <Textarea
          id="draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={isPending}
          minLength={40}
          placeholder="Paste the section you’re working on…"
        />
      </div>

      <Button onClick={run} disabled={isPending || draft.trim().length < 40}>
        {isPending ? "Reviewing…" : "Get reviewer feedback"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div className="space-y-4">
          {result.degraded && (
            <Card className="border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-100/90">
              Coaching degraded — showing a fallback critique. Citation candidates may still be useful.
            </Card>
          )}
          <Card className="p-5">
            <h2 className="font-medium">Overall · {result.sectionType.replace("_", " ")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{result.feedback.overall}</p>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4">
              <h3 className="font-medium">Strengths</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {result.feedback.strengths.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </Card>
            <Card className="p-4">
              <h3 className="font-medium">Weaknesses</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {result.feedback.weaknesses.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </Card>
          </div>
          <Card className="p-4">
            <h3 className="font-medium">Revision suggestions</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              {result.feedback.revisionSuggestions.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Card>
          <Card className="p-4">
            <h3 className="font-medium">Missing citations (model)</h3>
            {result.feedback.missingCitations.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">None flagged.</p>
            ) : (
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {result.feedback.missingCitations.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            )}
          </Card>
          {result.citationCandidates.length > 0 && (
            <section className="space-y-2">
              <h3 className="font-medium">Live search citation candidates</h3>
              {result.citationCandidates.map((p) => (
                <Card key={`${p.source}-${p.title}`} className="p-3">
                  <div className="flex justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.source} {p.year ? `· ${p.year}` : ""}
                      </p>
                    </div>
                    {p.url && (
                      <Link
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[hsl(var(--accent))]"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </section>
          )}
          {result.warnings.map((w) => (
            <Badge key={w} variant="outline">
              {w}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
