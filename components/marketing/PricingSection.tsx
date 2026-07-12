import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { BlurText } from "@/components/marketing/BlurText";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const FEATURES = [
  "Uniqueness scoring against real published abstracts",
  "Unlimited research sessions",
  "Conference matching with a realistic fallback path",
  "Venue-specific outline builder",
  "Section-by-section reviewer coaching",
  "Submission readiness checks",
  "Deadline reminders via Gmail + Calendar",
];

export function PricingSection() {
  return (
    <section id="pricing" className="border-b border-border py-14">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-start gap-4">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="text-balance text-3xl font-normal tracking-tight text-foreground md:text-5xl">
            <BlurText text="One price, everything included" />
          </h2>
        </div>

        <div className="mx-auto mt-8 max-w-md border border-[hsl(var(--accent))] bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-foreground">Lifetime access</span>
            <Badge>Limited-time</Badge>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-5xl font-normal tracking-tight text-foreground">$1</span>
            <span className="text-sm text-muted-foreground">one-time</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Every stage of the pipeline, no subscription, no per-feature tiers.
          </p>

          <Link
            href="/signup"
            className={buttonVariants({ className: "mt-5 w-full justify-center" })}
          >
            Get started
          </Link>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="shrink-0 text-xs text-muted-foreground">What&apos;s included</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <ul className="mt-4 flex flex-col gap-2.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(var(--accent))]" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
