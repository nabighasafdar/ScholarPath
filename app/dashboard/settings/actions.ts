"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/sessions";
import { isComposioConfigured } from "@/lib/composio/client";
import {
  createConnectLink,
  disconnectToolkit,
  getToolkitConnectionStatuses,
  type ComposioToolkit,
  type ToolkitConnectionStatus,
} from "@/lib/composio/connections";

const toolkitSchema = z.enum(["gmail", "googlecalendar"]);

function appOrigin(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
}

export type ConnectionsData = {
  configured: boolean;
  connections: ToolkitConnectionStatus[];
  composioUserId: string;
};

export async function getIntegrationsStatus(): Promise<ActionResult<ConnectionsData>> {
  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to manage integrations." } };
    }

    if (!isComposioConfigured()) {
      return {
        ok: true,
        data: {
          configured: false,
          connections: [
            {
              toolkit: "gmail",
              label: "Gmail",
              connected: false,
              authConfigMissing: true,
            },
            {
              toolkit: "googlecalendar",
              label: "Google Calendar",
              connected: false,
              authConfigMissing: true,
            },
          ],
          composioUserId: user.id,
        },
      };
    }

    const connections = await getToolkitConnectionStatuses(user.id);
    return {
      ok: true,
      data: { configured: true, connections, composioUserId: user.id },
    };
  } catch (err) {
    console.error("[settings] getIntegrationsStatus failed:", err);
    return {
      ok: false,
      error: { code: "internal_error", message: "Could not load integration status." },
    };
  }
}

export async function startToolkitConnect(input: {
  toolkit: ComposioToolkit;
}): Promise<ActionResult<{ redirectUrl: string }>> {
  const parsed = toolkitSchema.safeParse(input.toolkit);
  if (!parsed.success) {
    return { ok: false, error: { code: "validation_error", message: "Unknown toolkit." } };
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to connect apps." } };
    }
    if (!isComposioConfigured()) {
      return {
        ok: false,
        error: {
          code: "precondition",
          message: "COMPOSIO_API_KEY is missing. Add it to the server environment first.",
        },
      };
    }

    const callbackUrl = `${appOrigin()}/composio/callback?toolkit=${parsed.data}`;
    const { redirectUrl } = await createConnectLink({
      userId: user.id,
      toolkit: parsed.data,
      callbackUrl,
    });

    return { ok: true, data: { redirectUrl } };
  } catch (err) {
    console.error("[settings] startToolkitConnect failed:", err);
    const message = err instanceof Error ? err.message : "Could not start OAuth connect.";
    return { ok: false, error: { code: "composio_error", message } };
  }
}

export async function disconnectToolkitConnection(input: {
  toolkit: ComposioToolkit;
}): Promise<ActionResult<{ toolkit: ComposioToolkit }>> {
  const parsed = toolkitSchema.safeParse(input.toolkit);
  if (!parsed.success) {
    return { ok: false, error: { code: "validation_error", message: "Unknown toolkit." } };
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return { ok: false, error: { code: "unauthorized", message: "Sign in to disconnect apps." } };
    }

    await disconnectToolkit({ userId: user.id, toolkit: parsed.data });
    return { ok: true, data: { toolkit: parsed.data } };
  } catch (err) {
    console.error("[settings] disconnectToolkitConnection failed:", err);
    const message = err instanceof Error ? err.message : "Could not disconnect.";
    return { ok: false, error: { code: "composio_error", message } };
  }
}
