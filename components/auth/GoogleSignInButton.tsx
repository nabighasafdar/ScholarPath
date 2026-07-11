"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-60"
    >
      {loading ? "Redirecting…" : "Sign in with Google"}
    </button>
  );
}
