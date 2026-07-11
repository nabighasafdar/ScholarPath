/**
 * Server-side environment variable validation.
 * Import only from server code (Server Actions, route handlers, scripts).
 */

const required = [
  "GROQ_API_KEY",
  "PINECONE_API_KEY",
  "PINECONE_INDEX",
  "PINECONE_HOST",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

type EnvKey = (typeof required)[number];

function getEnv(key: EnvKey): string {
  const value = process.env[key];
  if (!value || value.includes("your-") || value.includes("here")) {
    throw new Error(
      `Missing or placeholder environment variable: ${key}. Copy .env.example to .env.local and fill in real values.`
    );
  }
  return value;
}

/** Validated server-side env — throws on first access if any required var is missing. */
export const env = {
  get groqApiKey() {
    return getEnv("GROQ_API_KEY");
  },
  get groqModel() {
    return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  },
  get pineconeApiKey() {
    return getEnv("PINECONE_API_KEY");
  },
  get pineconeIndex() {
    return getEnv("PINECONE_INDEX");
  },
  get pineconeHost() {
    return getEnv("PINECONE_HOST");
  },
  get supabaseServiceRoleKey() {
    return getEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  /** Optional — keyless Semantic Scholar works; a free key raises rate limits. */
  get semanticScholarApiKey(): string | undefined {
    const value = process.env.SEMANTIC_SCHOLAR_API_KEY;
    if (!value || value.includes("your-") || value.includes("here")) {
      return undefined;
    }
    return value;
  },
  /** Optional — Composio Gmail/Calendar deadline reminders. */
  get composioApiKey(): string | undefined {
    const value = process.env.COMPOSIO_API_KEY;
    if (!value || value.includes("your-") || value.includes("here")) {
      return undefined;
    }
    return value;
  },
  /**
   * Entity id used when connecting Gmail/Calendar in the Composio dashboard.
   * If unset, the signed-in Supabase user id is used.
   */
  get composioUserId(): string | undefined {
    const value = process.env.COMPOSIO_USER_ID;
    if (!value || value.includes("your-") || value.includes("here")) {
      return undefined;
    }
    return value;
  },
  get composioTimezone(): string {
    return process.env.COMPOSIO_TIMEZONE || "Asia/Karachi";
  },
  /** Composio Auth Config id for Gmail (ac_…). Optional if only one Gmail config exists. */
  get composioGmailAuthConfigId(): string | undefined {
    const value = process.env.COMPOSIO_GMAIL_AUTH_CONFIG_ID;
    if (!value || value.includes("your-") || value.includes("here")) return undefined;
    return value;
  },
  /** Composio Auth Config id for Google Calendar (ac_…). */
  get composioGoogleCalendarAuthConfigId(): string | undefined {
    const value = process.env.COMPOSIO_GOOGLECALENDAR_AUTH_CONFIG_ID;
    if (!value || value.includes("your-") || value.includes("here")) return undefined;
    return value;
  },
  /** Optional shared secret for `/api/cron/deadline-reminders`. */
  get cronSecret(): string | undefined {
    const value = process.env.CRON_SECRET;
    if (!value || value.includes("your-") || value.includes("here")) {
      return undefined;
    }
    return value;
  },
};

/** Client-safe Supabase config (NEXT_PUBLIC_* vars). */
export const supabaseClientConfig = {
  get url() {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
      ""
    );
  },
  /** Legacy anon JWT (`eyJ…`) or new publishable key (`sb_publishable_…`). */
  get anonKey() {
    return (
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
      ""
    );
  },
};

export function assertSupabaseBrowserConfig(): { url: string; anonKey: string } {
  const url = supabaseClientConfig.url;
  const anonKey = supabaseClientConfig.anonKey;
  if (
    !url ||
    !anonKey ||
    url.includes("your-") ||
    anonKey.includes("your-") ||
    anonKey.includes("here")
  ) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) in the environment, then redeploy."
    );
  }
  return { url, anonKey };
}

export function isEnvConfigured(): boolean {
  return required.every((key) => {
    const value = process.env[key];
    return Boolean(value && !value.includes("your-") && !value.includes("here"));
  });
}
