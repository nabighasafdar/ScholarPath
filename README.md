# ScholarPath

AI research co-pilot for students — uniqueness scoring, conference matching, outline building, section coaching, and submission readiness checks.

Paste a 2-sentence research idea → get a uniqueness score against real papers → iterate until the idea is publish-worthy → match conferences → build an outline → coach sections → check readiness.

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

Paper drafts are stored as text in Postgres (no file Storage required for MVP).

## Current status

| Phase | Goal | Status |
|-------|------|--------|
| **0** | Project setup, env, Pinecone + Supabase | Done (keys + migration are your responsibility) |
| **1** | Auth + app shell (Google sign-in, protected dashboard) | In progress — login, callback, middleware, basic dashboard |
| **2** | Abstract corpus + Pinecone ingest | Stub (`npm run ingest`) |
| **3** | Uniqueness engine (MVP centerpiece) | Planned |
| **4** | Conference matching | Planned |
| **5** | Outline builder | Planned |
| **6** | Section-by-section coaching | Planned |
| **7** | Submission readiness check | Planned |
| **8** | Deadline reminders | Planned |
| **9** | Polish, billing, deploy | Planned |

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

Copy the API key and index host into `.env.local`:

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
| `npm run create-index` | Helper to create / verify the Pinecone index |
| `npm run ingest` | Ingest paper abstracts into Pinecone (Phase 2) |

---

## Project structure

```
app/
  page.tsx                 # Landing → login / dashboard
  login/page.tsx           # Google sign-in
  auth/callback/route.ts   # OAuth code exchange
  dashboard/page.tsx       # Protected shell entry
components/
  auth/                    # AuthProvider, GoogleSignInButton, SignOutButton
lib/
  env.ts                   # Server-side env validation
  supabase/                # Browser, server, and admin clients
  llm/                     # Groq / LangChain helpers
  uniqueness/              # Scoring + explanation (Phase 3)
  conferences/             # Venue matching (Phase 4)
supabase/migrations/       # Postgres schema + RLS
scripts/
  ingest.ts                # Corpus ingestion (Phase 2)
  create-pinecone-index.ts
middleware.ts              # Session refresh + route protection
```

### Data model (Supabase)

- **`profiles`** — 1:1 with `auth.users` (email, display name); auto-created on signup
- **`paper_sessions`** — per-user research workspace (`idea_text`, `uniqueness_score`, status)
- **`score_attempts`** — history of uniqueness scores for a session (Phase 3)

RLS: users can only read/write their own rows.

---

## Build roadmap

### Phase 0 — Project setup

Scaffold, env validation, Groq + Pinecone + Supabase wiring. **Done on the code side**; you supply keys and run the SQL migration.

### Phase 1 — Auth + app shell

Google sign-in, protected routes, tabbed dashboard (Overview · Phases · Conferences · Uniqueness · Tech stack), session bootstrap in Postgres.

**Done so far:** login page, OAuth callback, middleware guard, AuthProvider, basic dashboard.  
**Still to do:** full 5-tab shell matching product UI, richer session helpers.

### Phase 2 — Abstract corpus + Pinecone index

`scripts/ingest.ts`:

- Pull abstracts from Semantic Scholar and arXiv (CS / EE / biomedical)
- Start with ~5K–10K to validate; scale toward ~50K
- Batch upsert (100 at a time) with checkpoints and rate-limit backoff
- Query test: sample idea → sensible nearest neighbors

### Phase 3 — Uniqueness engine (MVP centerpiece)

Ship this fully before other features.

- UI: textarea for a 2-sentence idea → score gauge, neighbor paper cards, overlap-vs-novel breakdown
- Server action → `lib/uniqueness/score.ts`: Pinecone integrated search (top 20), score from top-5 similarity
- `lib/uniqueness/explain.ts`: LangChain + Groq structured output (`overlaps`, `novelAspects`, `plagiarismRisk`, `suggestion`)
- Persist each attempt under the paper session

### Phase 4 — Conference matching

Seed venues (NeurIPS, ICSE, ICCV, IEEE Access, COMPSAS, SAI, …) with tier, field, acceptance rate, deadline, level fit. Rank by topic similarity + student level + timeline; show filterable card grid and a fallback path (“aim for COMPSAS, then IEEE Access if rejected”).

### Phase 5 — Outline builder

After topic + conference are set, generate a venue-specific outline (sections, page limit, citation style) plus suggested datasets, baselines, and metrics. Editable and saved on the session.

### Phase 6 — Section coaching

Paste abstract / related work / methodology → structured feedback (weaknesses, missing-citation finder via Pinecone + Semantic Scholar, reviewer-style comments). Coaching, not rewriting.

### Phase 7 — Submission readiness

Checklist agent vs chosen venue (formatting, word count, captions, references, clear contribution) → readiness score + tickable checklist.

### Phase 8 — Deadline reminders

Scheduled job checks conference deadlines daily; remind at 30 / 14 / 3 days (email or push).

### Phase 9 — Polish, billing, deploy

Tighten UI/UX, Stripe for pro tiers (gate re-scores / coaching volume), deploy on Vercel, lock down RLS, optional file Storage later if needed.

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
| Cost at larger scale | Start 5K–10K abstracts; Groq + Pinecone free/low tiers for MVP |
| Draft PDFs | Deferred — store section text in Postgres until Storage is needed |

## License

Private / FYP project — not licensed for public redistribution unless otherwise noted.
