# ScholarPath

An AI research co-pilot that walks a student from a raw research idea to a submitted paper — uniqueness scoring, conference matching, outline building, section coaching, submission readiness checks, and deadline reminders, all in one place.

## What we're building

Students and early-career researchers (especially undergrads doing a Final Year Project or first-time authors) run into the same wall over and over: they have an idea, but no way to tell if it's actually novel, no idea which venue would realistically accept it, and no structured help turning it into a submittable paper. Advisors are stretched thin, and generic AI chat tools don't know the literature or the submission process. ScholarPath is a focused tool for that exact gap — not a general writing assistant, a pipeline that mirrors how a paper actually gets from idea to submission:

1. **Uniqueness scoring** — paste a 2-sentence research idea and get a score against real published abstracts, with a plain-language explanation of what overlaps with existing work and what's actually novel. This is the entry point: if the idea isn't unique enough, nothing downstream matters yet.
2. **Iteration loop** — refine the idea based on the explanation and re-score, until it clears a publish-worthy threshold. The tool is deliberately built around iterate-then-advance, not a one-shot verdict.
3. **Conference matching** — once the idea is solid, match it against a seeded set of venues (tier, field, acceptance rate, deadline, difficulty) ranked by topic fit, student level, and timeline — including a realistic fallback path (e.g. "aim for X, fall back to Y if rejected") rather than only listing aspirational top-tier venues.
4. **Outline building** — generate a venue-specific outline (sections, page limits, citation style) plus suggested datasets, baselines, and metrics to target, editable and saved against the student's session.
5. **Section-by-section coaching** — paste a section draft (abstract, related work, methodology, …) and get structured, reviewer-style feedback: weaknesses, a missing-citation finder backed by the same paper corpus, and concrete suggestions. This is coaching, not ghostwriting — it critiques, it doesn't rewrite for you.
6. **Submission readiness check** — a checklist run against the chosen venue's actual requirements (formatting, word count, captions, references, a clearly stated contribution) that produces a readiness score and a tickable checklist before the student submits.
7. **Deadline tracking** — once a venue is chosen, the tool watches its deadline and reminds the student at meaningful intervals — in-app, plus real Gmail/Google Calendar reminders via Composio — so the previous six steps don't happen too late to matter.

The throughline is that every stage feeds the next: the idea's uniqueness score and iteration history follow the student into conference matching, the chosen venue shapes the outline, the outline shapes what coaching looks for, and readiness checks are scored against that same venue. The **Overview** dashboard ties it together with real numbers (sessions, score trend, pipeline completion), a few AI-suggested topics to try next, and the soonest upcoming venue deadlines.

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
| **Supabase** | Auth (email/password + Google OAuth) + Postgres (profiles, sessions, scores) with RLS |
| **LangChain** + **Groq** (`llama-3.3-70b-versatile`) | Scoring explanations, coaching, checklists, conference-path advice, topic suggestions |
| **Pinecone** | Standalone embedding API (`pc.inference.embed`, `llama-text-embed-v2`) for idea-vs-abstract and idea-vs-venue cosine similarity — no pre-built corpus index required |
| **Semantic Scholar + arXiv APIs** | Live, per-query literature search (optional `SEMANTIC_SCHOLAR_API_KEY` raises S2 rate limits) |
| **Composio** | Tool-integration layer connecting a student's own Gmail + Google Calendar for deadline reminders (OAuth popup from Settings/Onboarding, daily cron delivery) |
| **Recharts** | Overview dashboard charts (score-trend area chart) |
| **Radix UI** (`react-select`, `react-checkbox`, `react-label`, `react-slot`) + **class-variance-authority** | Design-system primitives (`components/ui/`) |
| **Tailwind CSS v3** + **framer-motion** | Styling, theme tokens, marketing-page motion |

Paper drafts are stored as text in Postgres (no file Storage required for MVP).

## Status

**Built:**
- Project scaffold, env validation, marketing landing page
- Auth: email/password + Google OAuth via Supabase, RLS-protected Postgres schema
- **Full pipeline**: uniqueness scoring, conference matching, outline builder, section coaching, readiness check, deadline tracking
- **Deadline delivery**: real Gmail + Google Calendar reminders via Composio (OAuth connect + daily cron), on top of in-app milestones
- **Dashboard UI**: persistent sidebar navigation, an Overview page with real stats (sessions, score trend, pipeline-completion tally), AI-suggested research topics, and upcoming conference deadlines
- **Onboarding**: a two-step flow after signup (product tour + optional Gmail/Calendar connect) shown once per account
- Design system: shared UI primitives (`Button`, `Card`, `Badge`, `Input`, `Label`, `Textarea`, `Select`, `Checkbox`) and success/warning/danger color tokens used consistently across every module

**Still ahead:** Stripe billing, deploy polish, richer attempt-history views.

---

## Getting started

### Prerequisites

- Node.js 18+
- Accounts: [Groq](https://console.groq.com/keys), [Pinecone](https://www.pinecone.io), [Supabase](https://supabase.com), [Google Cloud](https://console.cloud.google.com) (OAuth for Google sign-in), [Composio](https://composio.dev) (optional — Gmail/Calendar reminders)

### 1. Install

```bash
cd ScholarPath
npm install
cp .env.example .env.local
```

`.npmrc` already sets `legacy-peer-deps=true` (needed because `@langchain/community`'s optional `stagehand` peer wants `zod@3` while this app pins `zod@4`) — no extra flags needed.

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

Uniqueness scoring itself uses standalone `inference.embed()` calls (idea + live-search candidates), not this index — the index exists for an optional future bulk-corpus workflow (`scripts/ingest.ts`).

### 4. Supabase (Auth + Postgres)

1. Create a project at [supabase.com](https://supabase.com)
2. **Authentication → Providers → Google**: enable and paste OAuth Client ID/Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Add redirect URL: `http://localhost:3000/auth/callback`
4. **Project Settings → API**: copy Project URL, `anon` key, and `service_role` key
5. Run the migrations in order — **SQL Editor** → paste and Run each:
   - [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) — `profiles`, `paper_sessions`, `score_attempts` + RLS
   - [`supabase/migrations/002_pipeline.sql`](supabase/migrations/002_pipeline.sql) — pipeline JSONB columns (`selected_venue`, `outline`, `section_feedback`, `readiness`, `deadline_tracking`)
   - [`supabase/migrations/003_onboarding.sql`](supabase/migrations/003_onboarding.sql) — `onboarding_completed_at` column (gates the onboarding flow)
6. Fill `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # server only — never expose to the browser
```

### 5. Composio (optional — Gmail + Google Calendar reminders)

1. Create an account at [composio.dev](https://composio.dev) and copy an API key
2. Set in `.env.local`:

```bash
COMPOSIO_API_KEY=your-composio-api-key
COMPOSIO_TIMEZONE=Asia/Karachi   # optional, used for reminder scheduling
```

No auth-config setup needed — `createConnectLink()` (`lib/composio/connections.ts`) auto-creates a managed Auth Config on first connect. Each student connects their **own** Gmail/Calendar from **Settings** (or during onboarding) via an OAuth popup; nothing is shared across accounts. To also enable the daily reminder cron, set `CRON_SECRET` and point a scheduler at `/api/cron/deadline-reminders` with `Authorization: Bearer $CRON_SECRET`.

Skip this section entirely if you don't need Gmail/Calendar delivery — the rest of the app works without it (Settings will just show "not connected").

### 6. Verify

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Sign in** (email/password or Google) → a first-time account lands on `/onboarding`, then `/dashboard`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check only |
| `npm run create-index` | Create/verify the Pinecone integrated-embedding index |
| `npm run ingest` | Ingest paper abstracts into Pinecone (optional bulk corpus, unused by live-search scoring) |
| `npm run test:composio` | CLI smoke test for the Composio Gmail/Calendar reminder flow |

---

## Project structure

```
app/
  page.tsx                      # Landing page → /login or /dashboard
  login/, signup/                # Email/password + Google sign-in
  auth/callback/, auth/confirm/   # OAuth code exchange, email confirmation
  onboarding/                     # Post-signup: product tour + connect Gmail/Calendar
  composio/callback/              # OAuth popup landing page → postMessage to opener
  api/cron/deadline-reminders/    # Daily cron: send due Gmail reminders (CRON_SECRET-gated)
  dashboard/
    layout.tsx                    # Auth + onboarding gate, Sidebar, AuthProvider
    page.tsx                      # Overview — stats, score trend, pipeline progress, topic
                                   #   suggestions, upcoming deadlines
    actions.ts                    # suggestTopics server action
    uniqueness/                   # Uniqueness scoring UI + scoreIdea action
    conferences/                  # Conference matching UI + matchConferences/selectVenue
    outline/                      # Outline builder UI + generate/save actions
    coaching/                     # Section coaching UI + runSectionCoaching action
    readiness/                    # Readiness check UI + runReadinessCheck action
    deadlines/                    # Deadline tracking UI + schedule/acknowledge actions
    settings/                     # Composio connect/disconnect UI + actions

components/
  ui/                        # Design-system primitives: Button, Card, Badge, Input, Label,
                              #   Textarea, Select, Checkbox
  dashboard/                 # Sidebar, StatTile, ScoreTrendChart, PipelineProgress,
                              #   TopicSuggestions, UpcomingDeadlines, SessionSelect,
                              #   DashboardModuleShell
  onboarding/                # OnboardingFlow (2-step client wizard)
  icons/                     # AppLogos — Gmail / Google Calendar icon tiles
  auth/                      # AuthProvider, SignInForm, SignUpForm, GoogleSignInButton, SignOutButton
  settings/                  # IntegrationsPanel (Composio connect UI, shared with onboarding)
  uniqueness/, conferences/, outline/, coaching/, readiness/, deadlines/
                              # Per-module client forms
  marketing/                 # Landing-page sections (Hero, Problem, HowItWorks, Pricing, Faq, …)

lib/
  env.ts                     # Server-side env validation + client-safe Supabase config
  utils.ts                   # cn() className helper (clsx + tailwind-merge)
  action-result.ts           # Shared ActionResult<T> type for every server action
  sessions.ts                # requireUser / session list/load/update helpers
  scoreBucketStyles.ts        # Shared green/yellow/red → success/warning/danger class maps
  supabase/                  # client.ts (browser), server.ts (RSC/actions), admin.ts (service role)
  llm/client.ts               # LangChain ChatGroq factory — the only place ChatGroq is instantiated
  uniqueness/                 # Live literature search + standalone embed + score + explain
  conferences/                 # venues.ts (seeded list), match.ts (embedding + Groq path),
                                #   upcoming.ts (soonest-deadline helper for Overview)
  outline/, coaching/, readiness/  # Groq-backed stage engines
  deadlines/                  # milestones.ts (in-app countdown), reminders.ts (Composio email/calendar)
  composio/                   # client.ts (Composio SDK factory), connections.ts (connect/list/disconnect)
  dashboard/                  # stats.ts (Overview data), topicSuggestions.ts (AI topic ideas)

supabase/migrations/          # 001_init, 002_pipeline, 003_onboarding — Postgres schema + RLS

scripts/
  create-pinecone-index.ts    # Optional integrated-embedding index
  ingest.ts                    # Optional bulk corpus ingestion (unused by live-search uniqueness)
  test-composio-reminders.ts   # CLI smoke test for Composio reminders

middleware.ts                 # Session refresh + route protection (/dashboard/*, /onboarding/*)
```

### Data model (Supabase)

- **`profiles`** — 1:1 with `auth.users` (email, display name, `onboarding_completed_at`); auto-created on signup by a trigger
- **`paper_sessions`** — per-user research workspace (`idea_text`, `uniqueness_score`, `status`, and JSONB `selected_venue` / `outline` / `section_feedback` / `readiness` / `deadline_tracking`)
- **`score_attempts`** — history of uniqueness scores + explanations for a session

RLS: users can only read/write their own rows on all three tables.

---

## What's next

- **Stripe billing** for the pricing tiers already shown on the landing page
- **Deploy polish**: Vercel production hardening, RLS review
- **Richer attempt history**: per-session score-attempt timeline beyond the Overview trend chart
- *(Optional)* Bulk abstract corpus + Pinecone index (`scripts/ingest.ts`) if you want offline retrieval alongside live search

---

## Security notes

- All AI / Pinecone / Composio calls stay in **server actions** or route handlers — never expose `GROQ_API_KEY`, `PINECONE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `COMPOSIO_API_KEY` to the client.
- Only `NEXT_PUBLIC_*` vars are browser-visible.
- Keep real secrets in `.env.local` only (gitignored). Rotate any key that was ever committed or pasted into `.env.example`.
- The `/api/cron/deadline-reminders` route requires `Authorization: Bearer $CRON_SECRET` — without `CRON_SECRET` set, it always returns 401.

## Key risks

| Risk | Mitigation |
|------|------------|
| Live API rate limits (arXiv / Semantic Scholar) | Soft-fail per source; optional S2 API key; empty-corpus caveat UI |
| Embedding / Groq outages | Deterministic score still returns; explanations/suggestions degrade gracefully to a fallback |
| Score quality vs a curated corpus | Live search is broader but noisier; optional bulk ingest remains available later |
| Draft PDFs | Deferred — store section text in Postgres until Storage is needed |

## License

Private / FYP project — not licensed for public redistribution unless otherwise noted.
