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
    → Pinecone integrated embed + nearest-neighbor search
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
| **Pinecone** | Vector DB over paper abstracts — integrated embedding (`llama-text-embed-v2`, 1024-dim, cosine, field map `text`) |
| **Semantic Scholar + arXiv APIs** | Free, key-less sources for the abstract corpus |
| **Composio** *(planned)* | Tool-integration layer for connecting third-party services (Google Calendar, Gmail, Drive, and more over time) — starting with deadline reminders, expanding as new features need external tools |

Paper drafts are stored as text in Postgres (no file Storage required for MVP).

## Status

**Built:** project scaffold and env validation; Google sign-in via Supabase (login page, OAuth callback, session-refreshing middleware, protected dashboard route); the Postgres schema and RLS policies for profiles/sessions/scores; the Pinecone integrated-embedding index setup script; the Groq/LangChain client used for all model calls.

**In progress:** the full tabbed dashboard UI (Overview · Phases · Conferences · Uniqueness · Tech stack) — right now `/dashboard` is a placeholder shell, not the real product surface.

**Not started yet:** abstract corpus ingestion, the uniqueness scoring engine (the MVP centerpiece), conference matching, outline building, section coaching, submission readiness checks, deadline reminders, and billing/deploy polish. `lib/uniqueness/` and `lib/conferences/` are empty stubs; `scripts/ingest.ts` is a no-op placeholder.

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
5. Run the migration: **SQL Editor** → paste [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) → Run
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

Open [http://localhost:3000](http://localhost:3000) → **Sign in** → Google OAuth → `/dashboard`.

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
  login/page.tsx           # Google sign-in
  auth/callback/route.ts   # OAuth code exchange
  dashboard/page.tsx       # Protected shell entry (placeholder, not the real UI yet)
components/
  auth/                    # AuthProvider, GoogleSignInButton, SignOutButton
lib/
  env.ts                   # Server-side env validation
  supabase/                # Browser, server, and admin clients
  llm/                     # Groq / LangChain helpers
  uniqueness/              # Scoring + explanation engine (not yet implemented)
  conferences/             # Venue matching (not yet implemented)
supabase/migrations/       # Postgres schema + RLS
scripts/
  ingest.ts                # Corpus ingestion (not yet implemented)
  create-pinecone-index.ts
middleware.ts              # Session refresh + route protection
```

### Data model (Supabase)

- **`profiles`** — 1:1 with `auth.users` (email, display name); auto-created on signup
- **`paper_sessions`** — per-user research workspace (`idea_text`, `uniqueness_score`, status)
- **`score_attempts`** — history of uniqueness scores for a session

RLS: users can only read/write their own rows.

---

## What's next

Roughly in build order, since each depends on the previous one having real data or a working session model to attach to:

- **Abstract corpus** (`scripts/ingest.ts`): pull abstracts from Semantic Scholar and arXiv (starting with CS / EE / biomedical), batch-upsert into Pinecone with rate-limit backoff, starting around 5K–10K abstracts and scaling toward ~50K once the scoring quality is validated.
- **Uniqueness engine** (`lib/uniqueness/`): the MVP centerpiece — a textarea for the idea, a score gauge, neighbor-paper cards, and an overlap-vs-novel breakdown, backed by a server action that runs the Pinecone search and a Groq/LangChain call for structured explanation (`overlaps`, `novelAspects`, `plagiarismRisk`, `suggestion`).
- **Conference matching** (`lib/conferences/`): a seeded venue list (NeurIPS, ICSE, ICCV, IEEE Access, COMPSAS, SAI, …) ranked by topic similarity, student level, and timeline, shown as a filterable card grid with a fallback path.
- **Outline builder**: venue-specific outline generation once a conference is chosen.
- **Section coaching**: structured, reviewer-style feedback per section, including a missing-citation finder.
- **Submission readiness**: a checklist scored against the chosen venue's actual requirements.
- **Deadline reminders**: a scheduled check against tracked conference deadlines, delivered via Composio-connected tools (Gmail/Calendar).
- **Composio integrations**: beyond deadline reminders, wiring up Gmail, Google Drive, and other third-party tools as more features need them.
- **Polish & deploy**: the full tabbed dashboard UI, Stripe billing for pro tiers, deploy on Vercel, RLS hardening.

---

## Security notes

- All AI / Pinecone calls stay in **server actions** or route handlers — never expose `GROQ_API_KEY`, `PINECONE_API_KEY`, or `SUPABASE_SERVICE_ROLE_KEY` to the client.
- Only `NEXT_PUBLIC_*` vars are browser-visible.
- Keep real secrets in `.env.local` only (gitignored). Rotate any key that was ever committed or pasted into `.env.example`.

## Key risks

| Risk | Mitigation |
|------|------------|
| Corpus quality drives score quality | Bias ingest toward your field (CS) first |
| Semantic Scholar / arXiv rate limits | Batch + backoff in `ingest.ts` |
| Cost at larger scale | Start with 5K–10K abstracts; Groq + Pinecone free/low tiers cover the MVP |
| Draft PDFs | Deferred — store section text in Postgres until Storage is needed |

## License

Private / FYP project — not licensed for public redistribution unless otherwise noted.
