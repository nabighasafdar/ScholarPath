import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getIntegrationsStatus } from "@/app/dashboard/settings/actions";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileError && profile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  const integrations = await getIntegrationsStatus();

  return <OnboardingFlow initialIntegrations={integrations.ok ? integrations.data : null} />;
}
