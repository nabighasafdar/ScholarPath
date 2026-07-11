import type {
  CandidatePaper,
  RankedCandidate,
  ScoreBucket,
  ScoreResult,
} from "@/lib/uniqueness/types";

const TOP_K = 5;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function getScoreBucket(score: number): ScoreBucket {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

export function computeUniquenessScore(
  ideaVector: number[],
  candidates: CandidatePaper[],
  candidateVectors: number[][]
): ScoreResult {
  if (candidates.length === 0 || candidateVectors.length === 0) {
    return {
      score: 100,
      bucket: "green",
      topCandidates: [],
      corpusEmpty: true,
    };
  }

  const ranked: RankedCandidate[] = candidates.map((paper, index) => ({
    ...paper,
    similarity: cosineSimilarity(ideaVector, candidateVectors[index] ?? []),
  }));

  ranked.sort((a, b) => b.similarity - a.similarity);
  const topCandidates = ranked.slice(0, Math.min(TOP_K, ranked.length));
  const avg =
    topCandidates.reduce((sum, c) => sum + c.similarity, 0) / topCandidates.length;
  const score = Math.min(100, Math.max(0, Math.round(100 - avg * 100)));

  return {
    score,
    bucket: getScoreBucket(score),
    topCandidates,
    corpusEmpty: false,
  };
}
