import { z } from "zod";
import { createChatModel } from "@/lib/llm/client";
import type { ConferenceVenue } from "@/lib/conferences/venues";
import type { PaperOutline } from "@/lib/outline/generate";

export const readinessSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  checklist: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      status: z.enum(["pass", "fail", "warn"]),
      detail: z.string(),
    })
  ),
  nextActions: z.array(z.string()),
});

export type ReadinessReport = z.infer<typeof readinessSchema>;

function fallbackReadiness(venue: ConferenceVenue): ReadinessReport {
  return {
    score: 45,
    summary: `Baseline checklist for ${venue.shortName} while AI readiness was unavailable.`,
    checklist: venue.requirements.map((req, i) => ({
      id: `req-${i}`,
      label: req,
      status: "warn" as const,
      detail: "Verify manually against the venue CFP.",
    })),
    nextActions: [
      "Confirm page limit and anonymization rules",
      "Ensure contribution statement is explicit",
      "Re-run readiness once more draft text is available",
    ],
  };
}

export async function assessReadiness(input: {
  ideaText: string;
  venue: ConferenceVenue;
  outline: PaperOutline | null;
  draftNotes?: string;
}): Promise<{ report: ReadinessReport; degraded: boolean }> {
  try {
    const model = createChatModel({ temperature: 0.2 }).withStructuredOutput(readinessSchema, {
      name: "SubmissionReadiness",
    });

    const outlineSummary = input.outline
      ? input.outline.sections.map((s) => s.name).join(", ")
      : "none yet";

    const report = await model.invoke([
      {
        role: "system",
        content:
          "You assess whether a student paper is ready to submit to a specific venue. Be strict but actionable. score 0-100. checklist items should map to venue requirements and common submission pitfalls.",
      },
      {
        role: "user",
        content: `Venue: ${input.venue.name}
Page limit: ${input.venue.pageLimit}
Citation: ${input.venue.citationStyle}
Requirements: ${input.venue.requirements.join("; ")}

Idea: ${input.ideaText}
Outline sections: ${outlineSummary}
Student notes / draft status: ${input.draftNotes || "not provided"}

Return score, summary, checklist (pass|fail|warn), and nextActions.`,
      },
    ]);

    return { report: readinessSchema.parse(report), degraded: false };
  } catch (err) {
    console.error("[readiness] assessReadiness failed:", err);
    return { report: fallbackReadiness(input.venue), degraded: true };
  }
}
