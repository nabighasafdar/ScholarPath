import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { isComposioConfigured } from "@/lib/composio/client";
import { sendDueReminderEmails } from "@/lib/deadlines/reminders";
import type { ConferenceVenue } from "@/lib/conferences/venues";
import type { ScheduledReminder } from "@/lib/deadlines/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DeadlineTracking = {
  deadline?: string;
  emailedReminderKeys?: string[];
  scheduledReminders?: ScheduledReminder[];
};

/**
 * Daily cron: send Gmail for reminder slots whose date is today.
 * Protect with `Authorization: Bearer $CRON_SECRET`.
 *
 * Example (crontab / Vercel Cron):
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://your-host/api/cron/deadline-reminders
 */
export async function GET(request: Request) {
  const secret = env.cronSecret;
  const auth = request.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isComposioConfigured()) {
    return NextResponse.json({ ok: false, error: "Composio not configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const { data: sessions, error } = await admin
    .from("paper_sessions")
    .select("id, user_id, idea_text, selected_venue, deadline_tracking")
    .not("selected_venue", "is", null)
    .limit(200);

  if (error) {
    console.error("[cron/deadline-reminders] query failed:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const summary: Array<{ sessionId: string; sent: string[]; errors: string[] }> = [];

  for (const row of sessions ?? []) {
    const venue = row.selected_venue as ConferenceVenue | null;
    const tracking = (row.deadline_tracking ?? {}) as DeadlineTracking;
    const deadline = venue?.deadline ?? tracking.deadline;
    if (!deadline || !venue) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", row.user_id)
      .maybeSingle();

    const email = profile?.email as string | undefined;
    if (!email) continue;

    try {
      const result = await sendDueReminderEmails({
        supabaseUserId: row.user_id as string,
        recipientEmail: email,
        venueName: venue.shortName ?? venue.name,
        deadline,
        ideaText: (row.idea_text as string) ?? "",
        alreadySentKeys: tracking.emailedReminderKeys ?? [],
      });

      if (result.sent.length > 0) {
        const emailed = Array.from(
          new Set([...(tracking.emailedReminderKeys ?? []), ...result.sent])
        );
        await admin
          .from("paper_sessions")
          .update({
            deadline_tracking: {
              ...tracking,
              emailedReminderKeys: emailed,
              updatedAt: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
      }

      summary.push({ sessionId: row.id as string, sent: result.sent, errors: result.errors });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      summary.push({ sessionId: row.id as string, sent: [], errors: [message] });
    }
  }

  return NextResponse.json({ ok: true, processed: summary.length, summary });
}
