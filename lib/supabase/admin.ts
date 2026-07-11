import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, supabaseClientConfig } from "@/lib/env";

/**
 * Service-role Supabase client — bypasses Row Level Security.
 * Server-only; never import from a Client Component or expose to the browser.
 */
export function createAdminClient() {
  return createSupabaseClient(supabaseClientConfig.url, env.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
