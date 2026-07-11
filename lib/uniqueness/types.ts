export type PaperSource = "arxiv" | "semantic_scholar";

export type ScoreBucket = "green" | "yellow" | "red";

export type PlagiarismRisk = "low" | "medium" | "high";

export type CandidatePaper = {
  title: string;
  abstract: string;
  year: number | null;
  url: string;
  source: PaperSource;
};

export type RankedCandidate = CandidatePaper & {
  similarity: number;
};

export type UniquenessExplanation = {
  overlaps: string[];
  novelAspects: string[];
  plagiarismRisk: PlagiarismRisk;
  suggestion: string;
};

export type SearchResult = {
  candidates: CandidatePaper[];
  warnings: string[];
};

export type ScoreResult = {
  score: number;
  bucket: ScoreBucket;
  topCandidates: RankedCandidate[];
  corpusEmpty: boolean;
};

export type ScoreIdeaData = {
  sessionId: string;
  score: number;
  bucket: ScoreBucket;
  corpusEmpty: boolean;
  explanationDegraded: boolean;
  warnings: string[];
  topCandidates: RankedCandidate[];
  explanation: UniquenessExplanation;
};

export type ActionError = {
  code: string;
  message: string;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };
