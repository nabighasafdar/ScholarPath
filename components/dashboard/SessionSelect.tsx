"use client";

import type { PaperSessionRow } from "@/lib/action-result";
import { Label } from "@/components/ui/label";

export function SessionSelect({
  sessions,
  value,
  onChange,
  disabled,
}: {
  sessions: Array<Pick<PaperSessionRow, "id" | "idea_text" | "uniqueness_score" | "updated_at">>;
  value?: string;
  onChange: (sessionId: string) => void;
  disabled?: boolean;
}) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No scored ideas yet. Run Uniqueness scoring first so this stage has a session to attach to.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="session">Paper session</Label>
      <select
        id="session"
        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
        value={value ?? sessions[0]?.id ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {(s.idea_text.slice(0, 72) || "Untitled") + (s.idea_text.length > 72 ? "…" : "")}
            {typeof s.uniqueness_score === "number" ? ` · score ${s.uniqueness_score}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
