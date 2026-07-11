export type ActionError = {
  code: string;
  message: string;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export type PaperSessionRow = {
  id: string;
  user_id: string;
  idea_text: string;
  uniqueness_score: number | null;
  status: string;
  selected_venue: unknown | null;
  outline: unknown | null;
  section_feedback: unknown | null;
  readiness: unknown | null;
  deadline_tracking: unknown | null;
  created_at: string;
  updated_at: string;
};
