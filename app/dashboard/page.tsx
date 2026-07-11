import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Landmark,
  ListTree,
  MessagesSquare,
  CheckCircle2,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

const STAGES: {
  icon: LucideIcon;
  title: string;
  body: string;
  href: string;
}[] = [
  {
    icon: Target,
    title: "Uniqueness score",
    body: "Score a research idea against real published abstracts.",
    href: "/dashboard/uniqueness",
  },
  {
    icon: Landmark,
    title: "Conference matching",
    body: "Get ranked venues by topic fit, level, and timeline.",
    href: "/dashboard/conferences",
  },
  {
    icon: ListTree,
    title: "Outline builder",
    body: "Generate a venue-specific outline once a conference is chosen.",
    href: "/dashboard/outline",
  },
  {
    icon: MessagesSquare,
    title: "Section coaching",
    body: "Reviewer-style feedback on your drafted sections.",
    href: "/dashboard/coaching",
  },
  {
    icon: CheckCircle2,
    title: "Readiness check",
    body: "A checklist scored against your venue's requirements.",
    href: "/dashboard/readiness",
  },
  {
    icon: CalendarClock,
    title: "Deadline tracking",
    body: "Reminders as your chosen venue's deadline approaches.",
    href: "/dashboard/deadlines",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Full pipeline is live — start with uniqueness, then work through venues, outline, coaching,
        readiness, and deadlines.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage) => (
          <Link key={stage.title} href={stage.href} className="block">
            <Card className="h-full p-6 transition hover:border-[hsl(var(--accent))]/40">
              <div className="flex items-center justify-between">
                <stage.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                <Badge>Try it</Badge>
              </div>
              <h2 className="mt-4 font-medium text-foreground">{stage.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stage.body}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
