import { listSessionsForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import { DashboardModuleShell } from "@/components/dashboard/DashboardModuleShell";
import { ReadinessForm } from "@/components/readiness/ReadinessForm";

export default async function ReadinessPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sessions = await listSessionsForUser(user.id);

  return (
    <DashboardModuleShell
      title="Submission readiness"
      description="Checklist scored against your chosen venue’s requirements before you submit."
    >
      <ReadinessForm sessions={sessions} />
    </DashboardModuleShell>
  );
}
