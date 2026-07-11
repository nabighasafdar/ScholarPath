import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseBrowserConfig } from "@/lib/env";

/** Browser-side Supabase client — safe to use in Client Components. */
export function createClient() {
  const { url, anonKey } = assertSupabaseBrowserConfig();
  return createBrowserClient(url, anonKey);
}
