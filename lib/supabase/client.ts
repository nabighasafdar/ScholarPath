import { createBrowserClient } from "@supabase/ssr";
import { supabaseClientConfig } from "@/lib/env";

/** Browser-side Supabase client — safe to use in Client Components. */
export function createClient() {
  return createBrowserClient(supabaseClientConfig.url, supabaseClientConfig.anonKey);
}
