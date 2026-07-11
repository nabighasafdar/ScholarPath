import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UpcomingVenue } from "@/lib/conferences/upcoming";

function countdownTone(daysUntil: number) {
  if (daysUntil <= 14) return "text-danger";
  if (daysUntil <= 45) return "text-warning";
  return "text-muted-foreground";
}

export function UpcomingDeadlines({ venues }: { venues: UpcomingVenue[] }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-foreground">Upcoming deadlines</h2>
        <Link
          href="/dashboard/conferences"
          className="text-xs text-[hsl(var(--accent))] hover:underline"
        >
          Match a venue →
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">Soonest submission deadlines across tracked venues.</p>

      <div className="mt-4 space-y-2">
        {venues.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No upcoming deadlines in the current venue list.
          </p>
        ) : (
          venues.map((venue) => (
            <div
              key={venue.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{venue.shortName}</p>
                  <Badge variant="outline">{venue.field}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{venue.deadline}</p>
              </div>
              <p className={cn("text-sm font-medium", countdownTone(venue.daysUntil))}>
                {venue.daysUntil === 0 ? "Today" : `${venue.daysUntil}d left`}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
