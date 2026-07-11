"use server";

import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser, getSessionForUser, touchSession } from "@/lib/sessions";
import { isComposioConfigured } from "@/lib/composio/client";
import {
  scheduleDeadlineReminders,
  sendDueReminderEmails,
  type ScheduledReminder,
} from "@/lib/deadlines/reminders";
import type { ConferenceVenue } from "@/lib/conferences/venues";

type DeadlineTracking = {
  venueId?: string;
  deadline?: string;
  acknowledgedMilestones?: string[];
  remindersScheduledAt?: string;
  scheduledReminders?: ScheduledReminder[];
  emailedReminderKeys?: string[];
  updatedAt?: string;
};

const ackSchema = z.object({
  sessionId: z.string().uuid(),
  milestoneId: z.string().min(1),
});

const sessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export type AckMilestoneData = {
  sessionId: string;
  acknowledgedMilestones: string[];
};

export type ScheduleRemindersData = {
  sessionId: string;
  scheduledCount: number;
  confirmationEmailSent: boolean;
  skippedPast: string[];
  errors: string[];
  scheduledReminders: ScheduledReminder[];
};

export type SendDueRemindersData = {
  sessionId: string;
  sentKeys: string[];
  errors: string[];
};

export async function acknowledgeMilestone(input: {
  sessionId: string;
  milestoneId: string;
}): Promise<ActionResult<AckMilestoneData>> {
  const parsed = ackSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to track deadlines." } };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const existing = (session.deadline_tracking ?? {}) as DeadlineTracking;
    const acknowledged = new Set(existing.acknowledgedMilestones ?? []);
    acknowledged.add(parsed.data.milestoneId);

    const next: DeadlineTracking = {
      ...existing,
      acknowledgedMilestones: Array.from(acknowledged),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await touchSession(session.id, user.id, { deadline_tracking: next });
    if (error) {
      return { ok: false, error: { code: "db_error", message: "Could not save reminder state." } };
    }

    return {
      ok: true,
      data: { sessionId: session.id, acknowledgedMilestones: Array.from(acknowledged) },
    };
  } catch (err) {
    console.error("[deadlines] acknowledgeMilestone failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Could not update reminder. Try again." },
    };
  }
}

export async function scheduleReminders(input: {
  sessionId: string;
}): Promise<ActionResult<ScheduleRemindersData>> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  if (!isComposioConfigured()) {
    return {
      ok: false,
      error: {
        code: "precondition",
        message: "Add COMPOSIO_API_KEY to .env.local and connect Gmail + Google Calendar in Composio.",
      },
    };
  }

  try {
    const { user } = await requireUser();
    if (!user?.email) {
      return {
        ok: false,
        error: { code: "unauthorized", message: "Sign in with an email address to schedule reminders." },
      };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const venue = session.selected_venue as ConferenceVenue | null;
    const tracking = (session.deadline_tracking ?? {}) as DeadlineTracking;
    const deadline = venue?.deadline ?? tracking.deadline;
    if (!venue?.id || !deadline) {
      return {
        ok: false,
        error: { code: "precondition", message: "Select a venue before scheduling reminders." },
      };
    }

    const result = await scheduleDeadlineReminders({
      supabaseUserId: user.id,
      recipientEmail: user.email,
      venueName: venue.shortName ?? venue.name,
      deadline,
      ideaText: session.idea_text,
    });

    if (result.scheduled.length === 0 && result.errors.length > 0) {
      return {
        ok: false,
        error: {
          code: "composio_error",
          message: result.errors[0] ?? "Could not create calendar reminders.",
        },
      };
    }

    const next: DeadlineTracking = {
      ...tracking,
      venueId: venue.id,
      deadline,
      remindersScheduledAt: new Date().toISOString(),
      scheduledReminders: result.scheduled,
      emailedReminderKeys: tracking.emailedReminderKeys ?? [],
      updatedAt: new Date().toISOString(),
    };

    const { error } = await touchSession(session.id, user.id, { deadline_tracking: next });
    if (error) {
      console.error("[deadlines] persist schedule failed:", error);
      return {
        ok: false,
        error: { code: "db_error", message: "Reminders may have been created, but saving state failed." },
      };
    }

    return {
      ok: true,
      data: {
        sessionId: session.id,
        scheduledCount: result.scheduled.length,
        confirmationEmailSent: result.confirmationEmailSent,
        skippedPast: result.skippedPast,
        errors: result.errors,
        scheduledReminders: result.scheduled,
      },
    };
  } catch (err) {
    console.error("[deadlines] scheduleReminders failed:", err);
    const message = err instanceof Error ? err.message : "Could not schedule reminders.";
    return { ok: false, error: { code: "internal_error", message } };
  }
}

export async function sendDueRemindersNow(input: {
  sessionId: string;
}): Promise<ActionResult<SendDueRemindersData>> {
  const parsed = sessionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: "validation_error", message: parsed.error.issues[0]?.message ?? "Invalid input." },
    };
  }

  if (!isComposioConfigured()) {
    return {
      ok: false,
      error: {
        code: "precondition",
        message: "Add COMPOSIO_API_KEY to .env.local and connect Gmail + Google Calendar in Composio.",
      },
    };
  }

  try {
    const { user } = await requireUser();
    if (!user?.email) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to send reminders." } };
    }

    const session = await getSessionForUser(parsed.data.sessionId, user.id);
    if (!session) {
      return { ok: false, error: { code: "not_found", message: "Paper session not found." } };
    }

    const venue = session.selected_venue as ConferenceVenue | null;
    const tracking = (session.deadline_tracking ?? {}) as DeadlineTracking;
    const deadline = venue?.deadline ?? tracking.deadline;
    if (!venue?.id || !deadline) {
      return {
        ok: false,
        error: { code: "precondition", message: "Select a venue before sending reminders." },
      };
    }

    const result = await sendDueReminderEmails({
      supabaseUserId: user.id,
      recipientEmail: user.email,
      venueName: venue.shortName ?? venue.name,
      deadline,
      ideaText: session.idea_text,
      alreadySentKeys: tracking.emailedReminderKeys ?? [],
    });

    if (result.sent.length > 0) {
      const emailed = new Set([...(tracking.emailedReminderKeys ?? []), ...result.sent]);
      const next: DeadlineTracking = {
        ...tracking,
        emailedReminderKeys: Array.from(emailed),
        updatedAt: new Date().toISOString(),
      };
      await touchSession(session.id, user.id, { deadline_tracking: next });
    }

    return {
      ok: true,
      data: { sessionId: session.id, sentKeys: result.sent, errors: result.errors },
    };
  } catch (err) {
    console.error("[deadlines] sendDueRemindersNow failed:", err);
    const message = err instanceof Error ? err.message : "Could not send due reminders.";
    return { ok: false, error: { code: "internal_error", message } };
  }
}
