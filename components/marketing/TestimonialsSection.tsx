import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/marketing/Eyebrow";
import { BlurText } from "@/components/marketing/BlurText";

const TESTIMONIALS = [
  {
    quote:
      "I would've spent a month on an idea that overlapped 80% with a paper from 2019. ScholarPath caught it before I wrote a single page.",
    name: "Aiden Cole",
    role: "CS Senior, Crestview Institute of Technology",
  },
  {
    quote:
      "The conference matching alone saved me from submitting to a venue that was never going to accept a first-time author.",
    name: "Priya Nandan",
    role: "MSc Candidate, Meridian State University",
  },
  {
    quote:
      "Section coaching reads like a reviewer, not a chatbot. It told me exactly what my related-work section was missing.",
    name: "Marcus Webb",
    role: "Undergraduate Researcher, Lakeshore College of Engineering",
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-b border-border py-20">
      <div className="mx-auto max-w-5xl px-6">
        <div className="flex flex-col items-start gap-6">
          <Eyebrow>What students say</Eyebrow>
          <h2 className="text-balance text-3xl font-normal tracking-tight text-foreground md:text-5xl">
            <BlurText text="Built from student pain points" />
          </h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6">
                <p className="text-sm font-medium text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
