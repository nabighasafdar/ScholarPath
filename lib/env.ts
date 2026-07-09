/**
 * Server-side environment variable validation.
 * Import only from server code (Server Actions, route handlers, scripts).
 */

const required = [
  "GROQ_API_KEY",
  "PINECONE_API_KEY",
  "PINECONE_INDEX",
  "PINECONE_HOST",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_SERVICE_ACCOUNT",
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
  get firebaseServiceAccount() {
    return getEnv("FIREBASE_SERVICE_ACCOUNT");
  },
};

/** Client-safe Firebase config (NEXT_PUBLIC_* vars). */
export const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

export function isEnvConfigured(): boolean {
  return required.every((key) => {
    const value = process.env[key];
    return Boolean(value && !value.includes("your-") && !value.includes("here"));
  });
}
