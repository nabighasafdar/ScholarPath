import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Landmark,
  ListTree,
  MessagesSquare,
  CheckCircle2,
  CalendarClock,
} from "lucide-react";

const STAGES = [
  {
    icon: Target,
    title: "Uniqueness score",
    body: "Score a research idea against real published abstracts.",
  },
  {
    icon: Landmark,
    title: "Conference matching",
    body: "Get ranked venues by topic fit, level, and timeline.",
  },
  {
    icon: ListTree,
    title: "Outline builder",
    body: "Generate a venue-specific outline once a conference is chosen.",
  },
  {
    icon: MessagesSquare,
    title: "Section coaching",
    body: "Reviewer-style feedback on your drafted sections.",
  },
  {
    icon: CheckCircle2,
    title: "Readiness check",
    body: "A checklist scored against your venue's requirements.",
  },
  {
    icon: CalendarClock,
    title: "Deadline tracking",
    body: "Reminders as your chosen venue's deadline approaches.",
  },
];

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AuthProvider initialUser={user}>
      <div className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground">Signed in as {user.email}</p>
            </div>
            <SignOutButton />
          </header>

          <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            This dashboard fills in as each part of ScholarPath ships, starting with uniqueness
            scoring. Nothing below is live yet.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((stage) => (
              <Card key={stage.title} className="p-6">
                <div className="flex items-center justify-between">
                  <stage.icon className="h-5 w-5 text-[hsl(var(--accent))]" />
                  <Badge>Coming soon</Badge>
                </div>
                <h2 className="mt-4 font-medium text-foreground">{stage.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{stage.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
