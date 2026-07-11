import { z } from "zod";
import { createChatModel } from "@/lib/llm/client";
import type {
  RankedCandidate,
  ScoreBucket,
  UniquenessExplanation,
} from "@/lib/uniqueness/types";

const explanationSchema = z.object({
  overlaps: z.array(z.string()),
  novelAspects: z.array(z.string()),
  plagiarismRisk: z.enum(["low", "medium", "high"]),
  suggestion: z.string(),
});

const EMPTY_CORPUS_EXPLANATION: UniquenessExplanation = {
  overlaps: [],
  novelAspects: [
    "No comparable published abstracts were found for this idea in the live literature search.",
  ],
  plagiarismRisk: "low",
  suggestion:
    "This looks fully novel relative to what we could retrieve, but treat the score cautiously — we found no comparable published work to check against. Try rephrasing with more field-specific keywords, or add a Semantic Scholar API key if searches are being rate-limited.",
};

const DEGRADED_EXPLANATION: UniquenessExplanation = {
  overlaps: [],
  novelAspects: [],
  plagiarismRisk: "low",
  suggestion:
    "The uniqueness score was computed successfully, but the AI explanation is temporarily unavailable. Re-score in a moment for the overlap vs novelty write-up.",
};

function snippet(text: string, max = 300): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

export async function explainUniqueness(input: {
  ideaText: string;
  score: number;
  bucket: ScoreBucket;
  topCandidates: RankedCandidate[];
  corpusEmpty: boolean;
}): Promise<{ explanation: UniquenessExplanation; explanationDegraded: boolean }> {
  if (input.corpusEmpty || input.topCandidates.length === 0) {
    return { explanation: EMPTY_CORPUS_EXPLANATION, explanationDegraded: false };
  }

  try {
    const model = createChatModel({ temperature: 0.2 }).withStructuredOutput(
      explanationSchema,
      { name: "UniquenessExplanation" }
    );

    const paperBlock = input.topCandidates
      .map((paper, i) => {
        const simPct = Math.round(paper.similarity * 100);
        return `${i + 1}. "${paper.title}" (${paper.year ?? "n/a"}, ${paper.source}, similarity ${simPct}%)\n   ${snippet(paper.abstract)}`;
      })
      .join("\n\n");

    const explanation = await model.invoke([
      {
        role: "system",
        content:
          "You are a research advisor helping a student assess how unique their research idea is versus published abstracts. Be concrete and honest. Do not invent papers. Keep overlaps and novelAspects as short bullet-style strings. The numeric uniqueness score and bucket are already computed — keep your qualitative judgment consistent with them.",
      },
      {
        role: "user",
        content: `Research idea:\n${input.ideaText}\n\nComputed uniqueness score: ${input.score}/100 (bucket: ${input.bucket}).\nScore formula: 100 − average cosine similarity of the top overlapping abstracts × 100. Higher = more unique.\n\nTop overlapping papers:\n${paperBlock}\n\nReturn overlaps (what already exists), novelAspects (what still looks fresh), plagiarismRisk, and one actionable suggestion for how the student should refine the idea.`,
      },
    ]);

    return {
      explanation: explanationSchema.parse(explanation),
      explanationDegraded: false,
    };
  } catch (err) {
    console.error("[uniqueness] Groq explanation failed:", err);
    return { explanation: DEGRADED_EXPLANATION, explanationDegraded: true };
  }
}
