"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { suggestTopics } from "@/app/dashboard/actions";
import type { TopicSuggestion } from "@/lib/dashboard/topicSuggestions";

export function TopicSuggestions({
  initialTopics,
  initialDegraded,
}: {
  initialTopics: TopicSuggestion[];
  initialDegraded: boolean;
}) {
  const [topics, setTopics] = useState(initialTopics);
  const [degraded, setDegraded] = useState(initialDegraded);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    setError(null);
    startTransition(async () => {
      const res = await suggestTopics();
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setTopics(res.data.topics);
      setDegraded(res.data.degraded);
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-foreground">Topics worth trying</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {degraded
              ? "A starter list — personalize it once the model is available."
              : "Tailored to your recent ideas."}
          </p>
        </div>
        <Button size="sm" variant="outline" disabled={isPending} onClick={refresh}>
          <Sparkles className="h-3.5 w-3.5" />
          {isPending ? "Thinking…" : "Get new suggestions"}
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {topics.map((topic) => (
          <div key={topic.title} className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{topic.title}</p>
              <Badge variant="outline" className="shrink-0">
                {topic.field}
              </Badge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{topic.angle}</p>
            <Link
              href={`/dashboard/uniqueness?idea=${encodeURIComponent(`${topic.title} — ${topic.angle}`)}`}
              className="mt-3 inline-block text-xs text-[hsl(var(--accent))] hover:underline"
            >
              Score this idea →
            </Link>
          </div>
        ))}
      </div>
    </Card>
  );
}
