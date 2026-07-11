"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  acknowledgeMilestone,
  scheduleReminders,
  sendDueRemindersNow,
} from "@/app/dashboard/deadlines/actions";
import type { PaperSessionRow } from "@/lib/action-result";
import type { ConferenceVenue } from "@/lib/conferences/venues";
import { MILESTONES, daysUntil } from "@/lib/deadlines/milestones";
import type { ScheduledReminder } from "@/lib/deadlines/reminders";
import { SessionSelect } from "@/components/dashboard/SessionSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type DeadlineTracking = {
  deadline?: string;
  acknowledgedMilestones?: string[];
  remindersScheduledAt?: string;
  scheduledReminders?: ScheduledReminder[];
  emailedReminderKeys?: string[];
};

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
  const [info, setInfo] = useState<string | null>(null);
  const [acked, setAcked] = useState<string[] | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledReminder[] | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const session = sessions.find((s) => s.id === sessionId);
  const venue = session?.selected_venue as ConferenceVenue | null;
  const tracking = (session?.deadline_tracking ?? {}) as DeadlineTracking;

  const deadline = venue?.deadline ?? tracking.deadline;
  const remaining = deadline ? daysUntil(deadline) : null;
  const scheduledReminders = scheduled ?? tracking.scheduledReminders ?? [];
  const remindersAreScheduled = Boolean(scheduledAt ?? tracking.remindersScheduledAt);

  const activeMilestones = useMemo(() => {
    const acknowledged = acked ?? tracking.acknowledgedMilestones ?? [];
    if (remaining === null) return [];
    return MILESTONES.map((m) => ({
      ...m,
      due: remaining <= m.daysBefore,
      acknowledged: acknowledged.includes(m.id),
    }));
  }, [remaining, acked, tracking.acknowledgedMilestones]);

  function onSessionChange(id: string) {
    setSessionId(id);
    setAcked(null);
    setScheduled(null);
    setScheduledAt(null);
    setError(null);
    setInfo(null);
  }

  function ack(milestoneId: string) {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const response = await acknowledgeMilestone({ sessionId, milestoneId });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setAcked(response.data.acknowledgedMilestones);
    });
  }

  function onSchedule() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const response = await scheduleReminders({ sessionId });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      setScheduled(response.data.scheduledReminders);
      setScheduledAt(new Date().toISOString());
      const bits = [
        `Scheduled ${response.data.scheduledCount} calendar reminders`,
        response.data.confirmationEmailSent ? "confirmation email sent" : null,
        response.data.skippedPast.length
          ? `${response.data.skippedPast.length} past slots skipped`
          : null,
      ].filter(Boolean);
      setInfo(bits.join(" · "));
      if (response.data.errors.length) {
        setError(response.data.errors.join(" · "));
      }
    });
  }

  function onSendDue() {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const response = await sendDueRemindersNow({ sessionId });
      if (!response.ok) {
        setError(response.error.message);
        return;
      }
      if (response.data.sentKeys.length === 0) {
        setInfo("No reminder emails due today (or they were already sent).");
      } else {
        setInfo(`Sent ${response.data.sentKeys.length} due reminder email(s) via Gmail.`);
      }
      if (response.data.errors.length) {
        setError(response.data.errors.join(" · "));
      }
    });
  }

  if (sessions.length === 0 || withVenue.length === 0) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        Select a venue in{" "}
        <Link href="/dashboard/conferences" className="text-[hsl(var(--accent))] hover:underline">
          Conference matching
        </Link>{" "}
        to start deadline tracking and schedule Gmail/Calendar reminders.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SessionSelect
        sessions={withVenue}
        value={sessionId}
        onChange={onSessionChange}
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
            Each milestone gets a Gmail + Calendar reminder <strong>1 day before</strong> and{" "}
            <strong>on the day</strong> (8 reminders total). Connect apps in{" "}
            <Link href="/dashboard/settings" className="text-[hsl(var(--accent))] hover:underline">
              Settings
            </Link>{" "}
            first.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={onSchedule} disabled={isPending}>
              {isPending
                ? "Working…"
                : remindersAreScheduled
                  ? "Re-schedule Gmail & Calendar reminders"
                  : "Schedule Gmail & Calendar reminders"}
            </Button>
            <Button variant="outline" onClick={onSendDue} disabled={isPending}>
              Send due Gmail reminders now
            </Button>
          </div>
          {remindersAreScheduled && (
            <p className="mt-3 text-xs text-muted-foreground">
              Reminders scheduled
              {tracking.remindersScheduledAt || scheduledAt
                ? ` · ${scheduledReminders.length} calendar events`
                : ""}
              . Daily Gmail delivery also runs via{" "}
              <code className="text-foreground">/api/cron/deadline-reminders</code>.
            </p>
          )}
        </Card>
      )}

      {info && <p className="text-sm text-green-400">{info}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {scheduledReminders.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-foreground">Scheduled reminder dates</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            {scheduledReminders.map((r) => (
              <li key={r.key}>
                {r.date} — {r.label}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="space-y-3">
        {activeMilestones.map((m) => (
          <Card key={m.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{m.label}</p>
                <p className="text-xs text-muted-foreground">
                  {m.due
                    ? "Active for your timeline"
                    : `Triggers when ≤ ${m.daysBefore} days remain · reminders fire day-before + day-of`}
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
