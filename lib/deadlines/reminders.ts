import {
  getComposio,
  isComposioConfigured,
  resolveComposioUserId,
} from "@/lib/composio/client";
import { env } from "@/lib/env";
import {
  buildReminderSlots,
  todayIsoUtc,
  type ReminderSlot,
} from "@/lib/deadlines/milestones";

export type ScheduledReminder = {
  key: string;
  milestoneId: string;
  kind: string;
  date: string;
  label: string;
  calendarEventId?: string;
  calendarLink?: string;
};

export type ScheduleRemindersResult = {
  scheduled: ScheduledReminder[];
  skippedPast: string[];
  confirmationEmailSent: boolean;
  errors: string[];
};

type ExecuteResult = {
  successful?: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

function extractEventMeta(result: ExecuteResult): { id?: string; link?: string } {
  const data = result.data ?? {};
  const nested =
    (data.response_data as Record<string, unknown> | undefined) ??
    (data.response as Record<string, unknown> | undefined) ??
    data;
  const id =
    (nested.id as string | undefined) ??
    (nested.event_id as string | undefined) ??
    (data.id as string | undefined);
  const link =
    (nested.htmlLink as string | undefined) ??
    (nested.html_link as string | undefined) ??
    (data.htmlLink as string | undefined);
  return { id, link };
}

async function createCalendarEvent(input: {
  userId: string;
  slot: ReminderSlot;
  venueName: string;
  deadline: string;
  ideaSnippet: string;
}): Promise<{ ok: true; id?: string; link?: string } | { ok: false; error: string }> {
  const composio = getComposio();
  try {
    const result = (await composio.tools.execute("GOOGLECALENDAR_CREATE_EVENT", {
      userId: input.userId,
      dangerouslySkipVersionCheck: true,
      arguments: {
        summary: `ScholarPath · ${input.slot.label}`,
        description: [
          `Venue: ${input.venueName}`,
          `Submission deadline: ${input.deadline}`,
          `Paper: ${input.ideaSnippet}`,
          "",
          "Automated reminder from ScholarPath deadline tracking.",
        ].join("\n"),
        start_datetime: input.slot.startDatetime,
        timezone: env.composioTimezone,
        event_duration_minutes: 30,
        calendar_id: "primary",
        create_meeting_room: false,
        exclude_organizer: false,
        send_updates: "none",
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 0 },
            { method: "popup", minutes: 0 },
          ],
        },
      },
    })) as ExecuteResult;

    if (result.successful === false) {
      return { ok: false, error: result.error || "Calendar event creation failed." };
    }
    const meta = extractEventMeta(result);
    return { ok: true, id: meta.id, link: meta.link };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

async function sendGmail(input: {
  userId: string;
  to: string;
  subject: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const composio = getComposio();
  try {
    const result = (await composio.tools.execute("GMAIL_SEND_EMAIL", {
      userId: input.userId,
      dangerouslySkipVersionCheck: true,
      arguments: {
        recipient_email: input.to,
        subject: input.subject,
        body: input.body,
        is_html: false,
      },
    })) as ExecuteResult;

    if (result.successful === false) {
      return { ok: false, error: result.error || "Gmail send failed." };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Create Calendar events for each milestone (day-before + day-of) and email a confirmation.
 * Past reminder dates are skipped.
 */
export async function scheduleDeadlineReminders(input: {
  supabaseUserId: string;
  recipientEmail: string;
  venueName: string;
  deadline: string;
  ideaText: string;
}): Promise<ScheduleRemindersResult> {
  if (!isComposioConfigured()) {
    throw new Error("Composio is not configured (missing COMPOSIO_API_KEY).");
  }

  const composioUserId = resolveComposioUserId(input.supabaseUserId);
  const today = todayIsoUtc();
  const slots = buildReminderSlots(input.deadline);
  const ideaSnippet = input.ideaText.slice(0, 120) + (input.ideaText.length > 120 ? "…" : "");

  const scheduled: ScheduledReminder[] = [];
  const skippedPast: string[] = [];
  const errors: string[] = [];

  for (const slot of slots) {
    if (slot.date < today) {
      skippedPast.push(slot.key);
      continue;
    }

    const created = await createCalendarEvent({
      userId: composioUserId,
      slot,
      venueName: input.venueName,
      deadline: input.deadline,
      ideaSnippet,
    });

    if (!created.ok) {
      errors.push(`${slot.key}: ${created.error}`);
      continue;
    }

    scheduled.push({
      key: slot.key,
      milestoneId: slot.milestoneId,
      kind: slot.kind,
      date: slot.date,
      label: slot.label,
      calendarEventId: created.id,
      calendarLink: created.link,
    });
  }

  const lines = [
    `ScholarPath scheduled deadline reminders for ${input.venueName} (deadline ${input.deadline}).`,
    "",
    "You will get a Gmail + Calendar nudge 1 day before each milestone and on the milestone day:",
    ...scheduled.map((s) => `• ${s.date} — ${s.label}`),
    skippedPast.length
      ? `\nSkipped past dates: ${skippedPast.join(", ")}`
      : "",
    errors.length ? `\nSome calendar events failed:\n${errors.map((e) => `• ${e}`).join("\n")}` : "",
    "",
    "Open ScholarPath → Deadlines to mark milestones done as you complete them.",
  ].filter(Boolean);

  let confirmationEmailSent = false;
  if (scheduled.length > 0 || errors.length === 0) {
    const mail = await sendGmail({
      userId: composioUserId,
      to: input.recipientEmail,
      subject: `ScholarPath reminders set · ${input.venueName} · ${input.deadline}`,
      body: lines.join("\n"),
    });
    if (mail.ok) {
      confirmationEmailSent = true;
    } else {
      errors.push(`confirmation email: ${mail.error}`);
    }
  }

  return { scheduled, skippedPast, confirmationEmailSent, errors };
}

/**
 * Send Gmail for reminder slots whose date is today and not yet emailed.
 * Intended for a daily cron (or manual "Send due reminders" action).
 */
export async function sendDueReminderEmails(input: {
  supabaseUserId: string;
  recipientEmail: string;
  venueName: string;
  deadline: string;
  ideaText: string;
  alreadySentKeys: string[];
}): Promise<{ sent: string[]; errors: string[] }> {
  if (!isComposioConfigured()) {
    throw new Error("Composio is not configured (missing COMPOSIO_API_KEY).");
  }

  const composioUserId = resolveComposioUserId(input.supabaseUserId);
  const today = todayIsoUtc();
  const sentSet = new Set(input.alreadySentKeys);
  const due = buildReminderSlots(input.deadline).filter(
    (s) => s.date === today && !sentSet.has(s.key)
  );

  const sent: string[] = [];
  const errors: string[] = [];
  const ideaSnippet = input.ideaText.slice(0, 120) + (input.ideaText.length > 120 ? "…" : "");

  for (const slot of due) {
    const mail = await sendGmail({
      userId: composioUserId,
      to: input.recipientEmail,
      subject: `ScholarPath reminder · ${slot.label}`,
      body: [
        slot.label,
        "",
        `Venue: ${input.venueName}`,
        `Submission deadline: ${input.deadline}`,
        `Paper: ${ideaSnippet}`,
        "",
        slot.kind === "day_before"
          ? "This is your 1-day-before heads-up for this milestone."
          : "This milestone is due today — open ScholarPath → Deadlines to work it and mark it done.",
      ].join("\n"),
    });

    if (mail.ok) {
      sent.push(slot.key);
    } else {
      errors.push(`${slot.key}: ${mail.error}`);
    }
  }

  return { sent, errors };
}
