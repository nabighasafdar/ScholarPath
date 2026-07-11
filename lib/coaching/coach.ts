import { z } from "zod";
import { createChatModel } from "@/lib/llm/client";
import { searchCandidates } from "@/lib/uniqueness/search";
import type { CandidatePaper } from "@/lib/uniqueness/types";

export const SECTION_TYPES = [
  "abstract",
  "introduction",
  "related_work",
  "methodology",
  "experiments",
  "conclusion",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const coachingSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  missingCitations: z.array(z.string()),
  revisionSuggestions: z.array(z.string()),
  overall: z.string(),
});

export type CoachingFeedback = z.infer<typeof coachingSchema>;

const FALLBACK: CoachingFeedback = {
  strengths: ["Draft received — structural review pending model availability."],
  weaknesses: ["Could not run full AI coaching this round."],
  missingCitations: [],
  revisionSuggestions: ["Re-run coaching in a moment.", "Ensure claims cite specific prior work."],
  overall: "Score path is fine; explanation/coaching temporarily degraded.",
};

export async function coachSection(input: {
  ideaText: string;
  sectionType: SectionType;
  draft: string;
  venueName?: string;
}): Promise<{
  feedback: CoachingFeedback;
  citationCandidates: CandidatePaper[];
  degraded: boolean;
  warnings: string[];
}> {
  const query = `${input.sectionType} ${input.ideaText}`.slice(0, 300);
  const { candidates, warnings } = await searchCandidates(query);
  const citationCandidates = candidates.slice(0, 5);

  try {
    const model = createChatModel({ temperature: 0.2 }).withStructuredOutput(coachingSchema, {
      name: "SectionCoaching",
    });

    const paperList = citationCandidates
      .map((p, i) => `${i + 1}. ${p.title} (${p.year ?? "n/a"}) — ${p.url}`)
      .join("\n");

    const feedback = await model.invoke([
      {
        role: "system",
        content:
          "You are a strict but fair paper reviewer coaching a student. Critique; do NOT rewrite their section for them. Point out weaknesses, missing citations, and concrete revision moves.",
      },
      {
        role: "user",
        content: `Venue: ${input.venueName ?? "unspecified"}
Section: ${input.sectionType}
Research idea: ${input.ideaText}

Student draft:
${input.draft}

Possibly relevant papers from live search:
${paperList || "(none retrieved)"}

Return strengths, weaknesses, missingCitations (titles or themes they should cite), revisionSuggestions, and a short overall note.`,
      },
    ]);

    return {
      feedback: coachingSchema.parse(feedback),
      citationCandidates,
      degraded: false,
      warnings,
    };
  } catch (err) {
    console.error("[coaching] coachSection failed:", err);
    return {
      feedback: FALLBACK,
      citationCandidates,
      degraded: true,
      warnings,
    };
  }
}
