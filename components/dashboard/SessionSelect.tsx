"use client";

import type { PaperSessionRow } from "@/lib/action-result";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      <Select value={value ?? sessions[0]?.id ?? ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="session">
          <SelectValue placeholder="Choose a session" />
        </SelectTrigger>
        <SelectContent>
          {sessions.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {(s.idea_text.slice(0, 72) || "Untitled") + (s.idea_text.length > 72 ? "…" : "")}
              {typeof s.uniqueness_score === "number" ? ` · score ${s.uniqueness_score}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
