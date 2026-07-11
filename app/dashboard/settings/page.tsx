import { DashboardModuleShell } from "@/components/dashboard/DashboardModuleShell";
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";
import { getIntegrationsStatus } from "@/app/dashboard/settings/actions";
import { Card } from "@/components/ui/card";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { connected?: string };
}) {
  const status = await getIntegrationsStatus();

  return (
    <DashboardModuleShell
      title="Settings"
      description="Connect Gmail and Google Calendar for deadline reminders."
    >
      {searchParams?.connected ? (
        <p className="mb-4 text-sm text-success">
          Authorization returned for {searchParams.connected}. Status is shown below — click Refresh
          if it still says not connected.
        </p>
      ) : null}
      {status.ok ? (
        <IntegrationsPanel initial={status.data} />
      ) : (
        <Card className="p-6 text-sm text-danger">{status.error.message}</Card>
      )}
    </DashboardModuleShell>
  );
}
