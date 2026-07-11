import type { ScoreBucket } from "@/lib/uniqueness/types";

export const SCORE_BUCKET_TEXT: Record<ScoreBucket, string> = {
  green: "text-success",
  yellow: "text-warning",
  red: "text-danger",
};

export const SCORE_BUCKET_BADGE: Record<ScoreBucket, string> = {
  green: "border-success/40 bg-success/10 text-success",
  yellow: "border-warning/40 bg-warning/10 text-warning",
  red: "border-danger/40 bg-danger/10 text-danger",
};
