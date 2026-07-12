import { Eyebrow } from "@/components/marketing/Eyebrow";
import { BlurText } from "@/components/marketing/BlurText";

const POINTS = [
  {
    title: "No way to know if it's novel",
    body: "You have an idea, but no way to check it against the literature before investing weeks in it.",
  },
  {
    title: "No way to know where it fits",
    body: "Picking a conference or journal is a guessing game — tier, field, acceptance rate, and deadline rarely line up with a student's timeline.",
  },
  {
    title: "No structured path to submission",
    body: "Advisors are stretched thin, and generic AI chat tools don't know the literature or the submission process.",
  },
];

export function Problem() {
  return (
    <section className="relative border-b border-border py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" /></filter><rect width="100" height="100" filter="url(%23noise)" fill="%23ffffff"/></svg>\')',
        }}
      />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-start gap-6">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="text-balance text-3xl font-normal tracking-tight text-foreground md:text-5xl">
            <BlurText text="Every student hits the same wall" />
          </h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.title}>
              <h3 className="text-lg font-medium text-foreground">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
