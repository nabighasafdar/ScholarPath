import { listSessionsForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import { DashboardModuleShell } from "@/components/dashboard/DashboardModuleShell";
import { ConferenceMatchForm } from "@/components/conferences/ConferenceMatchForm";

export default async function ConferencesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sessions = await listSessionsForUser(user.id);

  return (
    <DashboardModuleShell
      title="Conference matching"
      description="Rank seeded venues by topic fit, then pick a primary aim and a realistic fallback."
    >
      <ConferenceMatchForm sessions={sessions} />
    </DashboardModuleShell>
  );
}
