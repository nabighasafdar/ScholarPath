# ScholarPath

An AI research co-pilot that walks a student from a raw research idea to a submitted paper — uniqueness scoring, conference matching, outline building, section coaching, and submission readiness checks, all in one place.

## What we're building

Students and early-career researchers (especially undergrads doing a Final Year Project or first-time authors) run into the same wall over and over: they have an idea, but no way to tell if it's actually novel, no idea which venue would realistically accept it, and no structured help turning it into a submittable paper. Advisors are stretched thin, and generic AI chat tools don't know the literature or the submission process. ScholarPath is a focused tool for that exact gap — not a general writing assistant, a pipeline that mirrors how a paper actually gets from idea to submission:

1. **Uniqueness scoring** — paste a 2-sentence research idea and get a score against real published abstracts, with a plain-language explanation of what overlaps with existing work and what's actually novel. This is the entry point: if the idea isn't unique enough, nothing downstream matters yet.
2. **Iteration loop** — refine the idea based on the explanation and re-score, until it clears a publish-worthy threshold. The tool is deliberately built around iterate-then-advance, not a one-shot verdict.
3. **Conference matching** — once the idea is solid, match it against a seeded set of venues (tier, field, acceptance rate, deadline, difficulty) ranked by topic fit, student level, and timeline — including a realistic fallback path (e.g. "aim for X, fall back to Y if rejected") rather than only listing aspirational top-tier venues.
4. **Outline building** — generate a venue-specific outline (sections, page limits, citation style) plus suggested datasets, baselines, and metrics to target, editable and saved against the student's session.
5. **Section-by-section coaching** — paste a section draft (abstract, related work, methodology, …) and get structured, reviewer-style feedback: weaknesses, a missing-citation finder backed by the same paper corpus, and concrete suggestions. This is coaching, not ghostwriting — it critiques, it doesn't rewrite for you.
6. **Submission readiness check** — a checklist run against the chosen venue's actual requirements (formatting, word count, captions, references, a clearly stated contribution) that produces a readiness score and a tickable checklist before the student submits.
7. **Deadline tracking** — once a venue is chosen, the tool watches its deadline and reminds the student at meaningful intervals so the previous six steps don't happen too late to matter.

The throughline is that every stage feeds the next: the idea's uniqueness score and iteration history follow the student into conference matching, the chosen venue shapes the outline, the outline shapes what coaching looks for, and readiness checks are scored against that same venue.

## How it works

```
2-sentence idea
    → live search: arXiv + Semantic Scholar (in parallel)
    → Pinecone standalone embed (llama-text-embed-v2) on idea + candidate abstracts
    → uniquenessScore = 100 − avg(top-5 cosine similarity) × 100
    → Groq (via LangChain) explains overlap vs novelty
    → student iterates
    → session saved in Supabase Postgres
```

**Score buckets:** `≥70` green (publish-worthy) · `40–69` yellow · `<40` red (too close — iterate)

## Tech stack

| Piece | Role |
|-------|------|
| **Next.js 14** (App Router + Server Actions) | UI + server-side AI calls (keys never reach the browser) |
| **Supabase** | Google Auth + Postgres (profiles, sessions, scores) with RLS |
| **LangChain** + **Groq** (`llama-3.3-70b-versatile`) | Scoring explanations, coaching, checklists |
| **Pinecone** | Standalone embedding API (`pc.inference.embed`, `llama-text-embed-v2`) for idea-vs-abstract cosine similarity — no pre-built corpus index required for uniqueness scoring |
| **Semantic Scholar + arXiv APIs** | Live, per-query literature search (optional `SEMANTIC_SCHOLAR_API_KEY` raises S2 rate limits) |
| **Composio** *(planned)* | Tool-integration layer for connecting third-party services (Google Calendar, Gmail, Drive, and more over time) — starting with deadline reminders, expanding as new features need external tools |

Paper drafts are stored as text in Postgres (no file Storage required for MVP).

## Status

**Built:** project scaffold and env validation; email/password auth via Supabase; marketing landing; Postgres schema/RLS; Groq/LangChain client; **full early pipeline** — uniqueness scoring, conference matching, outline builder, section coaching, readiness check, and in-app deadline milestones.

**Still later:** Composio email/calendar reminders, Stripe billing, Google OAuth re-enable, deploy polish, richer tabbed workspace UI.

---

## Getting started

### Prerequisites

- Node.js 18+
- Accounts: [Groq](https://console.groq.com/keys), [Pinecone](https://www.pinecone.io), [Supabase](https://supabase.com), [Google Cloud](https://console.cloud.google.com) (OAuth for Google sign-in)

### 1. Install

```bash
cd ScholarPath
npm install
cp .env.example .env.local
```

### 2. Groq (chat / explanations)

1. Create an API key at [console.groq.com/keys](https://console.groq.com/keys)
2. Set in `.env.local`:

```bash
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile   # optional
```

### 3. Pinecone (paper similarity)

Create a **Serverless** index with integrated embedding:

| Setting | Value |
|---------|--------|
| Name | `scholarpath-abstracts` |
| Model | `llama-text-embed-v2` |
| Dimension | `1024` |
| Metric | `cosine` |
| Field map | `text` |

`npm run create-index` does this for you (see [Scripts](#scripts) below). Copy the API key and index host into `.env.local`:

```bash
PINECONE_API_KEY=pcsk_...
PINECONE_INDEX=scholarpath-abstracts
PINECONE_HOST=https://scholarpath-abstracts-xxxxx.svc....pinecone.io
```

Ingestion upserts `{ text: abstract, title, year, url, ... }` — Pinecone embeds automatically (no separate OpenAI/local embedding step).

### 4. Supabase (Auth + Postgres)

1. Create a project at [supabase.com](https://supabase.com)
2. **Authentication → Providers → Google**: enable and paste OAuth Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Add redirect URL: `http://localhost:3000/auth/callback`
4. **Project Settings → API**: copy Project URL, `anon` key, and `service_role` key
5. Run the migrations: **SQL Editor** → paste [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql), then [`supabase/migrations/002_pipeline.sql`](supabase/migrations/002_pipeline.sql) → Run each.
6. Fill `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server only — never expose to the browser
```

### 5. Verify

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in** (email/password or Google if configured) → `/dashboard`.

**Important:** also run [`supabase/migrations/002_pipeline.sql`](supabase/migrations/002_pipeline.sql) so venue/outline/coaching/readiness/deadline columns exist.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run create-index` | Create/verify the Pinecone integrated-embedding index |
| `npm run ingest` | Ingest paper abstracts into Pinecone (not yet implemented) |

---

## Project structure

```
app/
  page.tsx                 # Landing → login / dashboard
  login/page.tsx           # Email/password sign-in
  signup/page.tsx          # Email/password sign-up
  auth/callback/route.ts   # OAuth code exchange (Google disabled for now)
  auth/confirm/route.ts    # Email confirmation
  dashboard/page.tsx       # Protected stage map
  dashboard/uniqueness/    # Uniqueness scoring UI + server action
components/
  auth/                    # AuthProvider, SignInForm, SignUpForm, SignOutButton
  uniqueness/              # UniquenessForm
  marketing/               # Landing sections
  ui/                      # Design-system primitives
lib/
  env.ts                   # Server-side env validation
  supabase/                # Browser, server, and admin clients
  llm/                     # Groq / LangChain helpers
  uniqueness/              # Live search + embed + score + explain
  conferences/             # Venue matching (not yet implemented)
supabase/migrations/       # Postgres schema + RLS
scripts/
  ingest.ts                # Optional bulk corpus (unused by uniqueness)
  create-pinecone-index.ts # Optional integrated-embedding index
middleware.ts              # Session refresh + route protection
```

### Data model (Supabase)

- **`profiles`** — 1:1 with `auth.users` (email, display name); auto-created on signup
- **`paper_sessions`** — per-user research workspace (`idea_text`, `uniqueness_score`, status)
- **`score_attempts`** — history of uniqueness scores for a session

RLS: users can only read/write their own rows.

---

## What's next

- **Composio deadline delivery**: push Gmail/Calendar reminders instead of in-app milestones only.
- **Richer workspace UI**: shared dashboard layout, attempt history, editable outline persistence UX.
- **Google OAuth**: re-enable the existing callback path.
- **Polish & deploy**: Stripe billing, Vercel deploy, RLS hardening.

*(Optional)* Bulk abstract corpus + Pinecone index (`scripts/ingest.ts`) if you want offline retrieval alongside live search.

---

## Security notes

- All AI / Pinecone calls stay in **server actions** or route handlers — never expose `GROQ_API_KEY`, `PINECONE_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Only `NEXT_PUBLIC_*` vars are browser-visible.
- Keep real secrets in `.env.local` only (gitignored). Rotate any key that was ever committed or pasted into `.env.example`.

## Key risks

| Risk | Mitigation |
|------|------------|
| Live API rate limits (arXiv / Semantic Scholar) | Soft-fail per source; optional S2 API key; empty-corpus caveat UI |
| Embedding / Groq outages | Deterministic score still returns; explanation degrades gracefully |
| Score quality vs a curated corpus | Live search is broader but noisier; optional bulk ingest remains available later |
| Draft PDFs | Deferred — store section text in Postgres until Storage is needed |

## License

Private / FYP project — not licensed for public redistribution unless otherwise noted.
