"use server";

import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/lib/sessions";

export async function completeOnboarding(): Promise<ActionResult<{ completed: true }>> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { ok: false, error: { code: "unauthorized", message: "Sign in to continue." } };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("[onboarding] completeOnboarding failed:", error);
    return {
      ok: false,
      error: { code: "internal_error", message: "Could not save onboarding status." },
    };
  }

  return { ok: true, data: { completed: true } };
}
