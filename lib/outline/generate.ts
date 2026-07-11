import { z } from "zod";
import { createChatModel } from "@/lib/llm/client";
import type { ConferenceVenue } from "@/lib/conferences/venues";

export const outlineSchema = z.object({
  titleSuggestion: z.string(),
  citationStyle: z.string(),
  pageBudget: z.string(),
  sections: z.array(
    z.object({
      name: z.string(),
      purpose: z.string(),
      targetWords: z.number().int().positive(),
      bullets: z.array(z.string()),
    })
  ),
  suggestedDatasets: z.array(z.string()),
  suggestedBaselines: z.array(z.string()),
  suggestedMetrics: z.array(z.string()),
  notes: z.string(),
});

export type PaperOutline = z.infer<typeof outlineSchema>;

const FALLBACK_OUTLINE = (venue: ConferenceVenue, ideaText: string): PaperOutline => ({
  titleSuggestion: "Working title from your research idea",
  citationStyle: venue.citationStyle,
  pageBudget: venue.pageLimit,
  sections: [
    {
      name: "Abstract",
      purpose: "Summarize problem, method, and key result.",
      targetWords: 200,
      bullets: ["Problem", "Approach", "Result", "Implication"],
    },
    {
      name: "Introduction",
      purpose: "Motivate the gap and state contributions.",
      targetWords: 800,
      bullets: ["Context", "Gap", "Contributions", "Paper map"],
    },
    {
      name: "Related Work",
      purpose: "Position against closest prior art.",
      targetWords: 700,
      bullets: ["Theme A", "Theme B", "Difference from yours"],
    },
    {
      name: "Method",
      purpose: "Describe your approach clearly enough to reproduce.",
      targetWords: 1200,
      bullets: ["Overview", "Details", "Complexity/assumptions"],
    },
    {
      name: "Experiments",
      purpose: "Show evidence with baselines and metrics.",
      targetWords: 1200,
      bullets: ["Setup", "Results", "Ablations"],
    },
    {
      name: "Conclusion",
      purpose: "Restate contribution and limitations.",
      targetWords: 400,
      bullets: ["Summary", "Limitations", "Future work"],
    },
  ],
  suggestedDatasets: ["Choose a public dataset aligned to your idea"],
  suggestedBaselines: ["Strong recent baseline from related work"],
  suggestedMetrics: ["Task-standard primary metric", "Error analysis"],
  notes: `Template outline for ${venue.shortName} while AI generation was unavailable. Idea: ${ideaText.slice(0, 120)}`,
});

export async function generateOutline(input: {
  ideaText: string;
  venue: ConferenceVenue;
}): Promise<{ outline: PaperOutline; degraded: boolean }> {
  try {
    const model = createChatModel({ temperature: 0.3 }).withStructuredOutput(outlineSchema, {
      name: "PaperOutline",
    });

    const outline = await model.invoke([
      {
        role: "system",
        content:
          "You help students build venue-specific paper outlines. Be concrete. Coaching style only — do not write the paper for them. Respect the venue page limit and citation style.",
      },
      {
        role: "user",
        content: `Venue: ${input.venue.name} (${input.venue.shortName})
Field: ${input.venue.field}
Page limit: ${input.venue.pageLimit}
Citation style: ${input.venue.citationStyle}
Requirements: ${input.venue.requirements.join("; ")}

Research idea:
${input.ideaText}

Return a practical outline with sections, suggested datasets/baselines/metrics, and short notes.`,
      },
    ]);

    return { outline: outlineSchema.parse(outline), degraded: false };
  } catch (err) {
    console.error("[outline] generateOutline failed:", err);
    return { outline: FALLBACK_OUTLINE(input.venue, input.ideaText), degraded: true };
  }
}
