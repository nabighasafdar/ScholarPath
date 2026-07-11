# Uniqueness Engine — Live Search + Standalone Embedding (No Ingestion Pipeline)

## Context

ScholarPath's roadmap originally called for building a Pinecone vector index seeded by bulk-ingesting ~5k-50k paper abstracts (`scripts/ingest.ts`, currently a stub) before the uniqueness-scoring feature could work. During planning we found a better fit: search arXiv + Semantic Scholar live, per query, and use Pinecone's **standalone embedding API** (`pc.inference.embed()`) directly — no index, no ingestion job, no corpus staleness. This plan builds that instead: the first real feature behind the dashboard's "Uniqueness score" card (currently a "Coming soon" placeholder), and the first Server Action in the app.

The `uniquenessScore = 100 − avg(top-5 cosine similarity) × 100` formula and the green/yellow/red (≥70 / 40-69 / <40) buckets are already documented in README.md/ARCHITECTURE.md and stay exactly as-is — only the *retrieval mechanism* changes.

## Approach

**Pipeline:** idea text → search arXiv + Semantic Scholar in parallel (live) → embed idea + candidates in one batched `pc.inference.embed()` call → cosine similarity + score in app code → Groq structured explanation → persist → display.

### 1. Search layer — `lib/uniqueness/types.ts`, `lib/uniqueness/search.ts`

- `CandidatePaper = { title, abstract, year, url, source: "arxiv" | "semantic_scholar" }`.
- `searchArxiv(query)`: `GET export.arxiv.org/api/query?search_query=all:...`, parsed with **`fast-xml-parser`** (new dependency — no XML parser is installed today; regex-parsing abstracts is too fragile). Force array coercion on `entry`/`link`/`author`. 8-10s timeout via `AbortController`.
- `searchSemanticScholar(query)`: `GET api.semanticscholar.org/graph/v1/paper/search?fields=title,abstract,year,url`. Uses `env.semanticScholarApiKey` header if present, otherwise keyless. Treat non-2xx as a soft failure (log + warning, return `[]`) — never throw.
- `searchCandidates(ideaText)`: `Promise.allSettled` on both sources, dedupe by normalized title, **hard cap at 30 candidates** (keeps idea+candidates ≤ 31, safely under `llama-text-embed-v2`'s 96-item batch limit), filter out null/stub abstracts (< 40 chars). Returns `{ candidates, warnings }`. Empty result (both sources down or zero usable abstracts) is a valid, handled state — not an error.

### 2. Scoring layer — `lib/uniqueness/embed.ts`, `lib/uniqueness/score.ts`

- `embedTexts(texts)`: one batched `pc.inference.embed({ model: "llama-text-embed-v2", inputs: texts, parameters: { inputType: "passage", truncate: "END" } })` call covering the idea **and** all candidates together (same `inputType` on both sides — this is a symmetric idea-vs-abstract comparison, not an asymmetric query/passage retrieval, so mixing input types would skew similarity).
- `cosineSimilarity(a, b)`: computed defensively (don't assume pre-normalized vectors).
- `computeUniquenessScore(ideaVector, candidateVectors)`: top-5 (or fewer — never pad with fake zeros) by similarity, `score = clamp(round(100 - avg(top) * 100), 0, 100)`.
- **Empty-corpus case**: 0 candidates → `score = 100`, flagged `corpusEmpty: true` so the explanation and UI both read "fully novel, but we found no comparable published work to check against — treat this cautiously," not a confident 100.
- `getScoreBucket(score)`: `"green" | "yellow" | "red"`, reusing the exact thresholds already in `components/marketing/HowItWorks.tsx`'s legend.

### 3. Explanation layer — `lib/uniqueness/explain.ts`

- Zod schema: `{ overlaps: string[], novelAspects: string[], plagiarismRisk: "low"|"medium"|"high", suggestion: string }`.
- `createChatModel({ temperature: 0.2 }).withStructuredOutput(schema, { name: "UniquenessExplanation" })` — confirmed present on the installed `@langchain/groq@1.3.1` (verified directly against `node_modules` types, not assumed).
- Prompt includes the idea, top overlapping papers (title/year/source/~300-char abstract snippet) **with their computed similarity %**, and the already-computed score/bucket — so the model's qualitative judgment stays consistent with the math instead of contradicting it.
- Empty-corpus case skips the Groq call entirely (avoids hallucinated "overlaps" against nothing) and returns a canned explanation.
- Any Groq failure → caught, logged server-side, falls back to a canned "score is valid, explanation unavailable" object (`explanationDegraded: true`) rather than failing the whole request — the deterministic score shouldn't be held hostage by an LLM hiccup.

### 4. Server Action — `app/dashboard/uniqueness/actions.ts`

```ts
"use server";
export async function scoreIdea(input: { ideaText: string; sessionId?: string }): Promise<ActionResult<ScoreIdeaData>>
```

- Local zod validation (`ideaText` 20-2000 chars) before any network call.
- Re-derives the user via `createClient()` + `getUser()` inside the action itself (Server Actions are separate requests — don't trust a prop from the page).
- Persists via the **regular** Supabase server client (not `admin.ts`), so RLS (`auth.uid() = user_id`) enforces ownership: update-or-insert `paper_sessions` (idea_text, uniqueness_score, status='scored', updated_at — set manually, no DB trigger exists), then insert a `score_attempts` row. The `explanation jsonb` column absorbs the LLM output **plus** the deterministic candidate/similarity list **plus** a `meta` block (`corpusEmpty`, `explanationDegraded`, `warnings`) — this avoids a new migration for storing candidate-paper data, which the current schema has no column for.
- **Known, accepted limitation**: the session update and the score_attempts insert are two sequential non-atomic calls (no Postgres RPC/transaction) — if the second fails after the first succeeds, the session score updates but that attempt's history row is missing. Fine for v1 (student can resubmit); true atomicity would need a new migration, out of scope here.
- **Error shape: `{ ok: true, data } | { ok: false, error: { code, message } }`, not thrown errors.** This is the first Server Action in the repo, setting precedent. Thrown errors would either need a new `error.tsx` boundary (wiping the student's typed idea on every expected, recoverable failure) or manual try/catch anyway — the `{ ok, ... }` shape lets the UI show an inline error next to the textarea and keep their draft text intact.

### 5. UI

- **New route**, not inline dashboard expansion: `app/dashboard/uniqueness/page.tsx` (Server Component, same 3-line auth guard as `app/dashboard/page.tsx`) + `components/uniqueness/UniquenessForm.tsx` (`"use client"`, following the `components/auth/` convention of colocating interactive components by domain, not inside `app/`). Reasoning: the current dashboard is an acknowledged placeholder the README says is getting redesigned — inlining stateful UI into it now risks throwaway work, while a separate route survives that redesign and just gets relinked. `middleware.ts`'s `PROTECTED_PREFIXES = ["/dashboard"]` already covers it with zero changes.
- `UniquenessForm`: holds `ideaText`, `sessionId` (set after first submit so re-scoring after an edit updates the same session — this is literally the README's "iterate-then-advance" loop), `result`, `error`. Uses `useTransition()` to call `scoreIdea` (not `useFormStatus` — need to manage `sessionId` across multiple submits, so a direct `startTransition(async () => {...})` call fits better than a plain form action).
- Score display reuses `Card`/`Badge` and the green/yellow/red bucket convention; shows candidate papers (title/source/year/similarity%/link) and the explanation fields; shows a caveat banner when `corpusEmpty` or there are search `warnings`.
- **New primitive**: `components/ui/textarea.tsx`, ported from `UI-Reference/components/ui/textarea.tsx` the same way `input.tsx` was already ported (same class patterns, dropping v4-only bits like `dark:bg-input/30`/`field-sizing-content`, using `min-h-32 resize-y` instead).
- Dashboard integration (`app/dashboard/page.tsx`): minimal diff — only the first `STAGES` entry gets an `href: "/dashboard/uniqueness"`; the render map wraps only cards with an `href` in a `<Link>` and swaps that card's badge text to "Try it." The other 5 cards are untouched.

### 6. Env additions — `lib/env.ts`, `.env.example`

- No new *required* var — `inference.embed()` only needs the already-required `pineconeApiKey`.
- One new **optional**, non-throwing getter: `env.semanticScholarApiKey` (returns `undefined` if unset or still a placeholder — never sent as a bogus header). Added to `.env.example` as a blank line with a comment explaining it's optional (keyless search works; a free key just raises the shared rate-limited pool to a dedicated 1 req/sec).

### 7. Documentation update (included in this pass)

README.md's "How it works" diagram/tech-stack row, ARCHITECTURE.md's system diagram + "Vector search (Pinecone)" section, and CLAUDE.md/AGENTS.md's phase notes all currently describe the old ingested-index architecture. Since those files exist specifically to keep future agents from assuming stale things, I'll update them alongside the code to describe live search + standalone embed — the score *formula* doesn't change, only the retrieval description.

### Explicitly out of scope

- `scripts/create-pinecone-index.ts` / `scripts/ingest.ts` — untouched, unused by this feature.
- `middleware.ts` — no changes needed.
- No "past attempts" history list view yet (only the latest attempt displays after submit) — so no `revalidatePath` needed either.
- No shared `app/dashboard/layout.tsx` — deferred until a second nested dashboard route exists.

## Critical files

- `lib/uniqueness/types.ts`, `search.ts`, `embed.ts`, `score.ts`, `explain.ts` — new
- `app/dashboard/uniqueness/page.tsx`, `actions.ts` — new
- `components/uniqueness/UniquenessForm.tsx` — new
- `components/ui/textarea.tsx` — new (ported from `UI-Reference`)
- `lib/env.ts` — add optional `semanticScholarApiKey` getter
- `.env.example` — add commented-out `SEMANTIC_SCHOLAR_API_KEY`
- `app/dashboard/page.tsx` — small diff to `STAGES` + render map
- `package.json` — add `fast-xml-parser`
- `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md` — update retrieval description

## Verification

1. `npm install` (new `fast-xml-parser` dep), `npm run lint`, `npx tsc --noEmit`, `npm run build` — all clean.
2. Smoke-test `withStructuredOutput` against a **real** Groq call early (not just type-checked) — its runtime decoding path for `llama-3.3-70b-versatile` isn't confirmed by types alone.
3. Start the dev server, sign in, go to `/dashboard` → click "Uniqueness score" → confirm it navigates to `/dashboard/uniqueness` and the other 5 cards still say "Coming soon."
4. Submit a real 2-sentence idea (something with likely arXiv/S2 hits, e.g. an LLM/ML idea) → confirm: candidates come back from both sources, a score renders with the right color bucket, explanation fields render, and a row appears in Supabase's `paper_sessions` + `score_attempts` tables (check via Supabase dashboard SQL editor).
5. Submit an idea worded so obscurely both searches return nothing (or temporarily break one API on purpose) → confirm the empty-corpus / partial-degradation paths render their caveat banners instead of crashing.
6. Re-submit an edited version of the same idea (using the same session) → confirm `paper_sessions` updates in place and a **second** `score_attempts` row is added (history, not overwrite).
