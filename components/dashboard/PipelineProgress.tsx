import { Landmark, ListTree, MessagesSquare, CheckCircle2, CalendarClock, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { CompletedAction } from "@/lib/dashboard/stats";

const ICON: Record<string, LucideIcon> = {
  venues: Landmark,
  outlines: ListTree,
  coaching: MessagesSquare,
  readiness: CheckCircle2,
  deadlines: CalendarClock,
};

export function PipelineProgress({ actions }: { actions: CompletedAction[] }) {
  return (
    <Card className="p-5">
      <h2 className="text-sm font-medium text-foreground">Pipeline progress</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">How many sessions have reached each stage.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {actions.map((action) => {
          const Icon = ICON[action.key];
          return (
            <div key={action.key} className="rounded-lg border border-border p-3">
              <Icon className="h-4 w-4 text-[hsl(var(--accent))]" />
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {action.count}
              </p>
              <p className="mt-0.5 text-xs leading-tight text-muted-foreground">{action.label}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
