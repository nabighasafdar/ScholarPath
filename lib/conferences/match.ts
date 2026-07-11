import { z } from "zod";
import { embedTexts } from "@/lib/uniqueness/embed";
import { cosineSimilarity } from "@/lib/uniqueness/score";
import { createChatModel } from "@/lib/llm/client";
import { VENUES, type ConferenceVenue, type VenueTier } from "@/lib/conferences/venues";

export type RankedVenue = ConferenceVenue & {
  topicFit: number;
};

export type MatchMeta = {
  primaryVenueId: string;
  fallbackVenueId: string;
  rationale: string;
  studentAdvice: string;
};

const matchMetaSchema = z.object({
  primaryVenueId: z.string(),
  fallbackVenueId: z.string(),
  rationale: z.string(),
  studentAdvice: z.string(),
});

export async function rankVenuesByTopic(ideaText: string): Promise<RankedVenue[]> {
  const texts = [ideaText, ...VENUES.map((v) => `${v.name}. ${v.topicDescription}. Topics: ${v.topics.join(", ")}`)];
  const vectors = await embedTexts(texts);
  const [ideaVector, ...venueVectors] = vectors;

  const ranked: RankedVenue[] = VENUES.map((venue, i) => ({
    ...venue,
    topicFit: cosineSimilarity(ideaVector, venueVectors[i] ?? []),
  }));

  ranked.sort((a, b) => b.topicFit - a.topicFit);
  return ranked;
}

function tierRank(tier: VenueTier): number {
  if (tier === "accessible") return 0;
  if (tier === "solid") return 1;
  return 2;
}

/** Prefer realistic student-friendly venues when topic fit is close. */
export function adjustForStudentPath(ranked: RankedVenue[]): RankedVenue[] {
  return [...ranked].sort((a, b) => {
    const fitDelta = b.topicFit - a.topicFit;
    if (Math.abs(fitDelta) > 0.05) return fitDelta;
    // Lower difficulty / more accessible first when fits are similar
    if (a.difficulty !== b.difficulty) return a.difficulty - b.difficulty;
    return tierRank(a.tier) - tierRank(b.tier);
  });
}

export async function suggestMatchPath(
  ideaText: string,
  ranked: RankedVenue[]
): Promise<{ meta: MatchMeta; degraded: boolean }> {
  const top = ranked.slice(0, 8);
  const fallbackMeta: MatchMeta = {
    primaryVenueId: top[0]?.id ?? VENUES[0].id,
    fallbackVenueId: top.find((v) => v.tier !== "top")?.id ?? top[1]?.id ?? top[0]?.id ?? VENUES[0].id,
    rationale:
      "Ranked by topic embedding similarity against a seeded venue list. Prefer a realistic aim + accessible fallback.",
    studentAdvice:
      "Aim for the primary venue if your uniqueness score is strong; keep the fallback ready for a faster publication path.",
  };

  try {
    const model = createChatModel({ temperature: 0.2 }).withStructuredOutput(matchMetaSchema, {
      name: "ConferenceMatchPath",
    });

    const list = top
      .map(
        (v, i) =>
          `${i + 1}. id=${v.id} ${v.shortName} (tier=${v.tier}, fit=${Math.round(v.topicFit * 100)}%, acceptance≈${v.acceptanceRate}%, difficulty=${v.difficulty}/5, deadline=${v.deadline}, level=${v.studentLevel})`
      )
      .join("\n");

    const meta = await model.invoke([
      {
        role: "system",
        content:
          "You advise undergraduate and early-career researchers on realistic publication venues. Pick primaryVenueId and fallbackVenueId ONLY from the provided id list. Prefer an aspirational-but-plausible primary and a more accessible fallback. Never invent venue ids.",
      },
      {
        role: "user",
        content: `Research idea:\n${ideaText}\n\nCandidate venues:\n${list}\n\nReturn primaryVenueId, fallbackVenueId, rationale, and studentAdvice.`,
      },
    ]);

    const parsed = matchMetaSchema.parse(meta);
    const ids = new Set(top.map((v) => v.id));
    if (!ids.has(parsed.primaryVenueId) || !ids.has(parsed.fallbackVenueId)) {
      return { meta: fallbackMeta, degraded: true };
    }
    return { meta: parsed, degraded: false };
  } catch (err) {
    console.error("[conferences] suggestMatchPath failed:", err);
    return { meta: fallbackMeta, degraded: true };
  }
}
