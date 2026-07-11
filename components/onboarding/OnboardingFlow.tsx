"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  Landmark,
  ListTree,
  MessagesSquare,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";
import { completeOnboarding } from "@/app/onboarding/actions";
import type { ConnectionsData } from "@/app/dashboard/settings/actions";

const STAGES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Target, title: "Uniqueness", body: "Score your idea against real published abstracts." },
  { icon: Landmark, title: "Conferences", body: "Match ranked venues by topic, level, and timeline." },
  { icon: ListTree, title: "Outline", body: "Generate a venue-specific paper outline." },
  { icon: MessagesSquare, title: "Coaching", body: "Get reviewer-style feedback, section by section." },
  { icon: CheckCircle2, title: "Readiness", body: "Check submission readiness against requirements." },
  { icon: CalendarClock, title: "Deadlines", body: "Track milestones as your deadline approaches." },
];

export function OnboardingFlow({
  initialIntegrations,
}: {
  initialIntegrations: ConnectionsData | null;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function finish() {
    startTransition(async () => {
      await completeOnboarding();
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 10%, hsl(var(--accent) / 0.16), transparent 45%), radial-gradient(circle at 85% 90%, hsl(var(--accent) / 0.1), transparent 45%)",
        }}
      />

      <div className="relative w-full max-w-2xl">
        <div className="mb-10 flex items-center justify-center gap-2">
          <span
            className={cn(
              "h-1.5 w-8 rounded-full transition-colors",
              step === 1 ? "bg-[hsl(var(--accent))]" : "bg-border"
            )}
          />
          <span
            className={cn(
              "h-1.5 w-8 rounded-full transition-colors",
              step === 2 ? "bg-[hsl(var(--accent))]" : "bg-border"
            )}
          />
        </div>

        {step === 1 ? (
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Welcome to ScholarPath
            </p>
            <h1 className="mt-3 text-balance text-3xl font-normal tracking-tight text-foreground md:text-4xl">
              Know if your idea is worth writing — before you write it.
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-balance text-sm leading-relaxed text-muted-foreground">
              Paste a 2-sentence research idea and we score it against real published papers, then
              carry it from a rough idea to a submission-ready draft — one stage at a time.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3 text-left sm:grid-cols-3">
              {STAGES.map((s) => (
                <div key={s.title} className="rounded-lg border border-border p-4">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[hsl(var(--accent))]/12">
                    <s.icon className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-foreground">{s.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>

            <Button size="lg" className="mt-10" onClick={() => setStep(2)}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                One more thing
              </p>
              <h1 className="mt-3 text-2xl font-normal tracking-tight text-foreground md:text-3xl">
                Connect Gmail and Google Calendar
              </h1>
              <p className="mx-auto mt-3 max-w-md text-balance text-sm leading-relaxed text-muted-foreground">
                Optional — link them so Deadlines can send reminders straight to your inbox and
                calendar. You can always do this later from Settings.
              </p>
            </div>

            <div className="mt-8">
              {initialIntegrations ? (
                <IntegrationsPanel initial={initialIntegrations} />
              ) : (
                <p className="text-center text-sm text-danger">
                  Could not load integration status.
                </p>
              )}
            </div>

            <div className="mt-10 flex items-center justify-center gap-3">
              <Button variant="outline" disabled={isPending} onClick={finish}>
                Skip for now
              </Button>
              <Button disabled={isPending} onClick={finish}>
                {isPending ? "Finishing…" : "Finish setup"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
