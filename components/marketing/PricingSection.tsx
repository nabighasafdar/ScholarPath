"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { BlurText } from "@/components/marketing/BlurText";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: string[];
  live: boolean;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    description: "Everything you need to check your first ideas.",
    features: ["Uniqueness scoring", "Iteration history", "1 active research session"],
    live: true,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 9,
    priceYearly: 7,
    description: "For students actively working toward submission.",
    features: ["Unlimited sessions", "Conference matching", "Outline builder", "Section coaching"],
    live: false,
    popular: true,
  },
  {
    id: "team",
    name: "Team",
    priceMonthly: 29,
    priceYearly: 23,
    description: "For labs and research groups.",
    features: ["Everything in Pro", "Shared sessions", "Priority support"],
    live: false,
  },
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="border-b border-border py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-start gap-6">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="text-balance text-3xl font-normal tracking-tight text-foreground md:text-5xl">
            <BlurText text="Start free, upgrade when it's worth it" />
          </h2>
        </div>

        <div className="mt-10 flex items-center gap-4">
          <span className={cn("text-sm", !isYearly ? "text-foreground" : "text-muted-foreground")}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="relative h-6 w-12 bg-white/10 p-1"
            aria-label="Toggle yearly billing"
          >
            <div
              className={cn(
                "h-4 w-4 bg-[hsl(var(--accent))] transition-transform",
                isYearly && "translate-x-6"
              )}
            />
          </button>
          <span className={cn("text-sm", isYearly ? "text-foreground" : "text-muted-foreground")}>
            Yearly
          </span>
          <Badge>20% off</Badge>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col gap-6 border p-6",
                plan.popular ? "border-[hsl(var(--accent))] bg-card" : "border-border bg-card/50"
              )}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-foreground">{plan.name}</span>
                  {plan.popular && <Badge>Most popular</Badge>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-normal tracking-tight text-foreground">
                    ${isYearly ? plan.priceYearly : plan.priceMonthly}
                  </span>
                  {plan.priceMonthly > 0 && (
                    <span className="text-sm text-muted-foreground">/month</span>
                  )}
                </div>
                <p className="min-h-[40px] text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {plan.live ? (
                <Link href="/signup" className={buttonVariants({ className: "justify-center" })}>
                  Get started
                </Link>
              ) : (
                <span
                  className={buttonVariants({
                    variant: "outline",
                    className: "cursor-not-allowed justify-center opacity-50",
                  })}
                >
                  Coming soon
                </span>
              )}

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="shrink-0 text-xs text-muted-foreground">Features</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <ul className="flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(var(--accent))]" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
