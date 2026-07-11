import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabaseClientConfig } from "@/lib/env";

/** Server-side Supabase client for Server Components, Server Actions, and Route Handlers. */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseClientConfig.url, supabaseClientConfig.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — safe to ignore since middleware
          // refreshes the session on every request.
        }
      },
    },
  });
}
