import { z } from "zod";
import { createChatModel } from "@/lib/llm/client";

export type TopicSuggestion = { title: string; angle: string; field: string };

const topicsSchema = z.object({
  topics: z
    .array(
      z.object({
        title: z.string(),
        angle: z.string(),
        field: z.string(),
      })
    )
    .length(5),
});

export const FALLBACK_TOPICS: TopicSuggestion[] = [
  {
    title: "Efficient fine-tuning for small on-device LLMs",
    angle: "Compare LoRA variants under strict memory budgets on real edge hardware.",
    field: "Machine Learning",
  },
  {
    title: "Hallucination detection in RAG pipelines",
    angle: "A lightweight classifier that flags unsupported claims before generation ships.",
    field: "NLP",
  },
  {
    title: "Accessibility gaps in AI coding assistants",
    angle: "A user study on how blind developers actually use Copilot-style tools.",
    field: "HCI",
  },
  {
    title: "Adversarial robustness of vision-language models",
    angle: "Cheap attacks that transfer across CLIP-style encoders.",
    field: "Computer Vision",
  },
  {
    title: "Privacy leakage in federated learning aggregation",
    angle: "Reconstructing training samples from gradient updates in realistic FL setups.",
    field: "Security",
  },
];

export async function getSuggestedTopics(
  recentIdeas: string[]
): Promise<{ topics: TopicSuggestion[]; degraded: boolean }> {
  try {
    const model = createChatModel({ temperature: 0.6 }).withStructuredOutput(topicsSchema, {
      name: "TopicSuggestions",
    });

    const context = recentIdeas.length
      ? `The student has recently explored these ideas:\n${recentIdeas
          .map((t, i) => `${i + 1}. ${t}`)
          .join("\n")}\n\nSuggest adjacent or complementary directions — not near-duplicates of what they already have.`
      : "The student hasn't scored any ideas yet. Suggest a spread of currently active, well-scoped research directions across different CS/AI subfields.";

    const result = await model.invoke([
      {
        role: "system",
        content:
          "You help students find specific, well-scoped research paper topics — not vague buzzwords. Each suggestion needs a concrete angle (a specific gap, comparison, or method) that could plausibly become a student-scale paper, not just a trendy area name. Favor topics with realistic room for a contribution over the next 6-12 months.",
      },
      {
        role: "user",
        content: `${context}\n\nReturn exactly 5 topic suggestions, each with a title (short), an angle (one sentence — the specific contribution), and a field.`,
      },
    ]);

    const parsed = topicsSchema.parse(result);
    return { topics: parsed.topics, degraded: false };
  } catch (err) {
    console.error("[dashboard] getSuggestedTopics failed:", err);
    return { topics: FALLBACK_TOPICS, degraded: true };
  }
}
