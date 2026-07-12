"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Target,
  RefreshCw,
  Landmark,
  ListTree,
  MessagesSquare,
  CheckCircle2,
  CalendarClock,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { BlurText } from "@/components/marketing/BlurText";

const STEPS = [
  {
    icon: Target,
    title: "Score your idea",
    body: "Paste a 2-sentence research idea and get a uniqueness score against real published abstracts.",
  },
  {
    icon: RefreshCw,
    title: "Iterate",
    body: "See what overlaps with existing work and what's actually novel, then refine and re-score.",
  },
  {
    icon: Landmark,
    title: "Match conferences",
    body: "Get ranked venues by topic fit, level, and timeline — with a realistic fallback path.",
  },
  {
    icon: ListTree,
    title: "Build an outline",
    body: "Generate a venue-specific outline with suggested datasets, baselines, and metrics.",
  },
  {
    icon: MessagesSquare,
    title: "Get section coaching",
    body: "Paste a draft section and get reviewer-style feedback and a missing-citation finder.",
  },
  {
    icon: CheckCircle2,
    title: "Check readiness",
    body: "Run a checklist scored against your chosen venue's actual requirements.",
  },
  {
    icon: CalendarClock,
    title: "Track deadlines",
    body: "Get reminded as the venue deadline approaches, so nothing above happens too late.",
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((prev) => (prev + 1) % STEPS.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const ActiveIcon = STEPS[active].icon;

  return (
    <section id="how-it-works" className="border-b border-border py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-start gap-6">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="max-w-2xl text-balance text-3xl font-normal tracking-tight text-foreground md:text-5xl">
            <BlurText text="Every stage feeds the next" />
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Your idea&apos;s score and iteration history follow you into conference matching, the
            venue you pick shapes the outline, and readiness checks are scored against that same
            venue.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-12 lg:grid-cols-2">
          <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border border-border bg-card">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center gap-4 text-center"
              >
                <ActiveIcon className="h-16 w-16 text-[hsl(var(--accent))]" strokeWidth={1.25} />
                <span className="text-sm font-medium text-muted-foreground">
                  Step {active + 1} of {STEPS.length}
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-4 left-4 right-4 flex h-1 gap-2">
              {STEPS.map((_, idx) => (
                <div key={idx} className="h-full flex-1 overflow-hidden bg-white/10">
                  {active === idx && (
                    <motion.div
                      className="h-full bg-[hsl(var(--accent))]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 6, ease: "linear" }}
                    />
                  )}
                  {idx < active && <div className="h-full w-full bg-[hsl(var(--accent))]" />}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {STEPS.map((step, i) => (
              <button
                key={step.title}
                onClick={() => setActive(i)}
                className={cn(
                  "group flex items-start gap-4 border p-4 text-left transition-colors",
                  active === i ? "border-border bg-card" : "border-transparent hover:bg-card/50"
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center text-sm font-medium transition-colors",
                    active === i
                      ? "bg-[hsl(var(--accent))] text-white"
                      : "bg-white/5 text-muted-foreground"
                  )}
                >
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h3
                    className={cn(
                      "font-medium transition-colors",
                      active === i ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </h3>
                  {active === i && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.body}
                    </p>
                  )}
                </div>
                <ChevronRight
                  className={cn(
                    "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-opacity",
                    active === i ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 border border-border bg-card px-6 py-4 text-sm">
          <span className="text-muted-foreground">Score buckets:</span>
          <span className="inline-flex items-center gap-2 text-foreground">
            <span className="h-2 w-2 rounded-full bg-success" /> ≥70 publish-worthy
          </span>
          <span className="inline-flex items-center gap-2 text-foreground">
            <span className="h-2 w-2 rounded-full bg-warning" /> 40–69 borderline
          </span>
          <span className="inline-flex items-center gap-2 text-foreground">
            <span className="h-2 w-2 rounded-full bg-danger" /> &lt;40 too close, iterate
          </span>
        </div>
      </div>
    </section>
  );
}
