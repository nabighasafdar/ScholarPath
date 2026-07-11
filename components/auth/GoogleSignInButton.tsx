"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center"
        disabled={loading}
        onClick={handleClick}
      >
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
