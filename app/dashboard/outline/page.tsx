import { listSessionsForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import { DashboardModuleShell } from "@/components/dashboard/DashboardModuleShell";
import { OutlineForm } from "@/components/outline/OutlineForm";

export default async function OutlinePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sessions = await listSessionsForUser(user.id);

  return (
    <DashboardModuleShell
      title="Outline builder"
      description="Generate a venue-specific outline with datasets, baselines, and metrics to target."
    >
      <OutlineForm sessions={sessions} />
    </DashboardModuleShell>
  );
}
