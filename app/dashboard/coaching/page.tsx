import { listSessionsForUser } from "@/lib/sessions";
import { createClient } from "@/lib/supabase/server";
import { DashboardModuleShell } from "@/components/dashboard/DashboardModuleShell";
import { CoachingForm } from "@/components/coaching/CoachingForm";

export default async function CoachingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const sessions = await listSessionsForUser(user.id);

  return (
    <DashboardModuleShell
      title="Section coaching"
      description="Paste a draft section for reviewer-style critique and missing-citation hints — not ghostwriting."
    >
      <CoachingForm sessions={sessions} />
    </DashboardModuleShell>
  );
}
