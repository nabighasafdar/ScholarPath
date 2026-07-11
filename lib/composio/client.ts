import { Composio } from "@composio/core";
import { env } from "@/lib/env";

let client: Composio | null = null;

/** Shared Composio client — only construct when API key is configured. */
export function getComposio(): Composio {
  const apiKey = env.composioApiKey;
  if (!apiKey) {
    throw new Error(
      "COMPOSIO_API_KEY is not set. Add it to .env.local after connecting Gmail and Google Calendar in Composio."
    );
  }
  if (!client) {
    client = new Composio({ apiKey });
  }
  return client;
}

export function isComposioConfigured(): boolean {
  return Boolean(env.composioApiKey);
}

/**
 * App flows always use the signed-in Supabase user id so each student
 * connects their own Gmail/Calendar from Settings.
 */
export function resolveComposioUserId(supabaseUserId: string): string {
  return supabaseUserId;
}

/** CLI / smoke-test override — prefer COMPOSIO_USER_ID when set. */
export function resolveComposioUserIdForScripts(fallback = "scholarpath-dev"): string {
  return env.composioUserId ?? fallback;
}
