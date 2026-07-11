import { listSessionsForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import { DashboardModuleShell } from "@/components/dashboard/DashboardModuleShell";
import { DeadlinesPanel } from "@/components/deadlines/DeadlinesPanel";

export default async function DeadlinesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sessions = await listSessionsForUser(user.id);

  return (
    <DashboardModuleShell
      title="Deadline tracking"
      description="Watch your chosen venue’s deadline and tick meaningful countdown milestones."
    >
      <DeadlinesPanel sessions={sessions} />
    </DashboardModuleShell>
  );
}
