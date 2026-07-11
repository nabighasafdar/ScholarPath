/**
 * Smoke-test Composio Gmail + Google Calendar (deadline reminder plumbing).
 *
 * Run:
 *   npm run test:composio
 *
 * Required in .env.local:
 *   COMPOSIO_API_KEY
 *   COMPOSIO_USER_ID   — entity id used when you connected Gmail/Calendar in Composio
 *   COMPOSIO_TEST_EMAIL — inbox that should receive the test message (usually your Gmail)
 *
 * Optional:
 *   COMPOSIO_TIMEZONE (default Asia/Karachi)
 */

import { Composio } from "@composio/core";

type ExecuteResult = {
  successful?: boolean;
  error?: string;
  data?: Record<string, unknown>;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value || value.includes("your-") || value.includes("here")) {
    throw new Error(`Missing ${name} in .env.local`);
  }
  return value;
}

function plusMinutesLocalIso(minutesFromNow: number): string {
  const d = new Date(Date.now() + minutesFromNow * 60_000);
  // GOOGLECALENDAR_CREATE_EVENT wants YYYY-MM-DDTHH:MM:SS (no Z / offset)
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

async function main() {
  const apiKey = required("COMPOSIO_API_KEY");
  const userId = process.env.COMPOSIO_USER_ID?.trim() || "scholarpath-dev";
  if (!process.env.COMPOSIO_USER_ID?.trim()) {
    console.warn(
      "COMPOSIO_USER_ID not set — using scholarpath-dev. Prefer connecting via Settings in the app (uses your Supabase user id)."
    );
  }
  const testEmail = required("COMPOSIO_TEST_EMAIL");
  const timezone = process.env.COMPOSIO_TIMEZONE?.trim() || "Asia/Karachi";

  const composio = new Composio({ apiKey });
  const stamp = new Date().toISOString();
  let failed = false;

  console.log("Composio reminder smoke test");
  console.log(`  userId:    ${userId}`);
  console.log(`  email:     ${testEmail}`);
  console.log(`  timezone:  ${timezone}`);
  console.log("");

  // --- Gmail ---
  console.log("1) GMAIL_SEND_EMAIL …");
  try {
    const mail = (await composio.tools.execute("GMAIL_SEND_EMAIL", {
      userId,
      dangerouslySkipVersionCheck: true,
      arguments: {
        recipient_email: testEmail,
        subject: `[ScholarPath] Composio Gmail test ${stamp}`,
        body: [
          "This is a ScholarPath smoke test.",
          "If you received this, Gmail via Composio is working.",
          "",
          `Sent at: ${stamp}`,
        ].join("\n"),
        is_html: false,
      },
    })) as ExecuteResult;

    if (mail.successful === false) {
      failed = true;
      console.error("   FAIL:", mail.error || mail);
    } else {
      console.log("   OK — check inbox:", testEmail);
    }
  } catch (err) {
    failed = true;
    console.error("   FAIL:", err instanceof Error ? err.message : err);
  }

  // --- Google Calendar ---
  const start = plusMinutesLocalIso(60);
  console.log(`2) GOOGLECALENDAR_CREATE_EVENT (starts ~${start} ${timezone}) …`);
  try {
    const event = (await composio.tools.execute("GOOGLECALENDAR_CREATE_EVENT", {
      userId,
      dangerouslySkipVersionCheck: true,
      arguments: {
        summary: `[ScholarPath] Composio Calendar test ${stamp.slice(0, 19)}`,
        description: "ScholarPath smoke test — safe to delete.",
        start_datetime: start,
        timezone,
        event_duration_minutes: 30,
        calendar_id: "primary",
        create_meeting_room: false,
        send_updates: "none",
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 0 },
            { method: "email", minutes: 0 },
          ],
        },
      },
    })) as ExecuteResult;

    if (event.successful === false) {
      failed = true;
      console.error("   FAIL:", event.error || event);
    } else {
      const data = (event.data ?? {}) as Record<string, unknown>;
      const nested =
        (data.response_data as Record<string, unknown> | undefined) ??
        (data.response as Record<string, unknown> | undefined) ??
        data;
      const link =
        (nested.htmlLink as string | undefined) ??
        (nested.html_link as string | undefined) ??
        "";
      console.log("   OK — check Google Calendar for the new event.");
      if (link) console.log("   link:", link);
    }
  } catch (err) {
    failed = true;
    console.error("   FAIL:", err instanceof Error ? err.message : err);
  }

  console.log("");
  if (failed) {
    console.error(
      "Result: FAILED. Confirm Gmail + Google Calendar are connected in Composio for COMPOSIO_USER_ID, then retry."
    );
    process.exit(1);
  }

  console.log("Result: PASSED — Gmail send + Calendar create both succeeded.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
