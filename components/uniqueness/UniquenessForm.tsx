"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  loadSessionScoreHistory,
  scoreIdea,
  type ScoreAttemptSummary,
} from "@/app/dashboard/uniqueness/actions";
import type { ScoreBucket, ScoreIdeaData } from "@/lib/uniqueness/types";
import type { PaperSessionRow } from "@/lib/action-result";
import { SessionSelect } from "@/components/dashboard/SessionSelect";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BUCKET_STYLES: Record<ScoreBucket, string> = {
  green: "border-green-500/40 bg-green-500/10 text-green-400",
  yellow: "border-yellow-500/40 bg-yellow-500/10 text-yellow-400",
  red: "border-red-500/40 bg-red-500/10 text-red-400",
};

const BUCKET_LABELS: Record<ScoreBucket, string> = {
  green: "Publish-worthy (≥70)",
  yellow: "Borderline (40–69)",
  red: "Too close (<40)",
};

function sourceLabel(source: string) {
  return source === "arxiv" ? "arXiv" : "Semantic Scholar";
}

export function UniquenessForm({
  sessions,
  initialSessionId,
  initialIdeaText,
  initialResult,
  initialAttempts,
}: {
  sessions: Array<Pick<PaperSessionRow, "id" | "idea_text" | "uniqueness_score" | "updated_at">>;
  initialSessionId?: string;
  initialIdeaText?: string;
  initialResult?: ScoreIdeaData | null;
  initialAttempts?: ScoreAttemptSummary[];
}) {
  const [ideaText, setIdeaText] = useState(initialIdeaText ?? "");
  const [sessionId, setSessionId] = useState<string | undefined>(initialSessionId);
  const [result, setResult] = useState<ScoreIdeaData | null>(initialResult ?? null);
  const [attempts, setAttempts] = useState<ScoreAttemptSummary[]>(initialAttempts ?? []);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function switchSession(id: string) {
    setSessionId(id);
    setError(null);
    startTransition(async () => {
      const response = await loadSessionScoreHistory({ sessionId: id });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setIdeaText(response.data.ideaText);
      setResult(response.data.latest);
      setAttempts(response.data.attempts);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await scoreIdea({ ideaText, sessionId });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setSessionId(response.data.sessionId);
      setResult(response.data);
      setAttempts((prev) => [
        {
          id: `local-${Date.now()}`,
          score: response.data.score,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 10));
    });
  }

  function startFresh() {
    setSessionId(undefined);
    setIdeaText("");
    setResult(null);
    setAttempts([]);
    setError(null);
  }

  return (
    <div className="space-y-8">
      {sessions.length > 0 && (
        <div className="space-y-3">
          <SessionSelect
            sessions={sessions}
            value={sessionId ?? sessions[0]?.id}
            onChange={switchSession}
            disabled={isPending}
          />
          <Button type="button" variant="outline" size="sm" onClick={startFresh} disabled={isPending}>
            New idea
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="idea">Research idea</Label>
          <Textarea
            id="idea"
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            placeholder="Paste a 2-sentence research idea (20–2000 characters)…"
            disabled={isPending}
            required
            minLength={20}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">
            {ideaText.trim().length}/2000 characters
            {sessionId ? " · Re-scoring updates the same session" : ""}
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" disabled={isPending || ideaText.trim().length < 20}>
          {isPending ? "Scoring…" : sessionId ? "Re-score idea" : "Score uniqueness"}
        </Button>
      </form>

      {attempts.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-medium text-foreground">Score history</h2>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {attempts.map((a) => (
              <li key={a.id}>
                {a.score}/100 · {new Date(a.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {(result.corpusEmpty || result.warnings.length > 0 || result.explanationDegraded) && (
            <Card className="border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-100/90">
              {result.corpusEmpty && (
                <p>
                  Fully novel relative to what we retrieved — but we found no comparable published
                  work to check against. Treat this score cautiously.
                </p>
              )}
              {result.explanationDegraded && (
                <p className={result.corpusEmpty || result.warnings.length ? "mt-2" : undefined}>
                  Score is valid; the AI explanation was unavailable this round.
                </p>
              )}
              {result.warnings.map((warning) => (
                <p key={warning} className="mt-2 text-muted-foreground">
                  {warning}
                </p>
              ))}
            </Card>
          )}

          <Card className="p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Uniqueness score</p>
                <p className="mt-1 text-5xl font-bold tracking-tight text-foreground">
                  {result.score}
                  <span className="text-lg font-medium text-muted-foreground">/100</span>
                </p>
              </div>
              <Badge className={cn("px-3 py-1 text-sm", BUCKET_STYLES[result.bucket])}>
                {BUCKET_LABELS[result.bucket]}
              </Badge>
            </div>
          </Card>

          {result.topCandidates.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-medium text-foreground">Closest published work</h2>
              <div className="grid gap-3">
                {result.topCandidates.map((paper) => (
                  <Card key={`${paper.source}-${paper.url}-${paper.title}`} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{paper.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {sourceLabel(paper.source)}
                          {paper.year ? ` · ${paper.year}` : ""}
                          {" · "}
                          {Math.round(paper.similarity * 100)}% similar
                        </p>
                      </div>
                      {paper.url && (
                        <Link
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[hsl(var(--accent))] hover:underline"
                        >
                          Open <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                      {paper.abstract}
                    </p>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <h3 className="font-medium text-foreground">Overlaps</h3>
              {result.explanation.overlaps.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No clear overlaps called out.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {result.explanation.overlaps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-5">
              <h3 className="font-medium text-foreground">Novel aspects</h3>
              {result.explanation.novelAspects.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">No novel aspects called out.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {result.explanation.novelAspects.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium text-foreground">Suggestion</h3>
              <Badge variant="outline">plagiarism risk: {result.explanation.plagiarismRisk}</Badge>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {result.explanation.suggestion}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
