# AGENTS.md

Guidance for AI coding agents (Cursor, Codex CLI, Aider, Claude Code, etc.) working in this repository. See also `CLAUDE.md` (Claude Code-specific) — the two should stay in sync.

## Project

ScholarPath is an AI research co-pilot for students — uniqueness scoring, conference matching, outline building, section coaching, submission readiness checks, and deadline reminders.

```
2-sentence idea
    → live search: arXiv + Semantic Scholar
    → Pinecone standalone embed (llama-text-embed-v2) on idea + candidates
    → uniquenessScore = 100 − avg(top-5 cosine similarity) × 100
    → Groq (via LangChain) explains overlap vs novelty
    → student iterates
    → session saved in Supabase Postgres
```

Score buckets: `≥70` green (publish-worthy) · `40–69` yellow · `<40` red (too close — iterate).

The app is Next.js 14 (App Router) with Supabase for auth (email/password + Google OAuth)/Postgres, Pinecone standalone embeddings for idea-vs-abstract and idea-vs-venue similarity, live arXiv/Semantic Scholar search, Groq (via LangChain) for explanations/coaching/outline/readiness/topic suggestions, and Composio for real Gmail/Google Calendar deadline reminders. The full pipeline is shipped: uniqueness → conferences → outline → coaching → readiness → deadlines (in-app + Composio email/calendar). The dashboard uses a persistent sidebar (not tabs), a stats/charts Overview page, and a 2-step onboarding flow.

## Commands

```bash
npm run dev            # Start dev server at http://localhost:3000
npm run build           # Production build
npm run lint            # ESLint (next/core-web-vitals + next/typescript)
npx tsc --noEmit        # Type-check only
npm run create-index    # Create/verify the Pinecone integrated-embedding index (scripts/create-pinecone-index.ts)
npm run ingest          # Ingest paper abstracts into Pinecone (optional bulk corpus, unused by live-search uniqueness)
npm run test:composio   # CLI smoke test for the Composio Gmail/Calendar reminder flow
```

There is no test runner configured in this repo yet (no Jest/Vitest).

`.npmrc` sets `legacy-peer-deps=true` — `@langchain/community`'s optional `stagehand` peer dependency conflicts with the pinned `zod` version. This is unrelated to app code; don't try to "fix" it by changing the `zod` version.

`create-index`, `ingest`, and `test:composio` run via `tsx --env-file=.env.local`, so they load `.env.local` directly rather than through Next.js's env handling — required env vars must be real values, not placeholders (see `lib/env.ts`).

## Environment

Copy `.env.example` to `.env.local` and fill in real keys:

- **Groq** — chat/explanations/coaching/topic suggestions (`GROQ_API_KEY`, `GROQ_MODEL`)
- **Pinecone** — standalone embedding for uniqueness + conference matching (`PINECONE_API_KEY`). `PINECONE_INDEX` / `PINECONE_HOST` remain required by `lib/env.ts` for the optional index scripts but are unused by uniqueness scoring itself.
- **Supabase** — Auth + Postgres (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Run all three migrations (`001_init.sql`, `002_pipeline.sql`, `003_onboarding.sql`) before testing end-to-end.
- **Semantic Scholar** (optional) — `SEMANTIC_SCHOLAR_API_KEY`; keyless works, a free key improves rate limits.
- **Composio** (optional) — `COMPOSIO_API_KEY` enables Gmail/Calendar deadline reminders; `COMPOSIO_TIMEZONE` (default `Asia/Karachi`); `CRON_SECRET` gates `/api/cron/deadline-reminders`.

`.env.local` (and any file matching `.env*`) is gitignored — never commit real keys. `.env.example` must stay placeholder-only and is intentionally tracked so `cp .env.example .env.local` works for a fresh clone.

`lib/env.ts` is the only place server-side env vars should be read from (`import { env } from "@/lib/env"`). It lazily validates on each getter access and throws if a required var is missing or still holds a placeholder value. Optional vars return `undefined` instead of throwing. Client components must use `supabaseClientConfig` (also exported from `lib/env.ts`) rather than reading `NEXT_PUBLIC_*` vars directly.

## Architecture

- `app/page.tsx` — landing page; links to `/dashboard` if already signed in, else `/login`.
- `app/login/`, `app/signup/` — email/password + Google sign-in/sign-up.
- `app/onboarding/` — 2-step post-signup flow (product tour → connect Gmail/Calendar), gated by `profiles.onboarding_completed_at`, fail-open if that column isn't present yet.
- `app/composio/callback/page.tsx` — OAuth popup landing page for Composio connect.
- `app/api/cron/deadline-reminders/route.ts` — daily cron (`Authorization: Bearer $CRON_SECRET`) emailing due reminders across all users via the service-role client.
- `app/dashboard/layout.tsx` — auth + onboarding gate, `AuthProvider`, `Sidebar` (persistent left nav, not tabs).
- `app/dashboard/page.tsx` + `actions.ts` — Overview: stats (`lib/dashboard/stats.ts`), score-trend chart, pipeline-completion tally, AI topic suggestions, upcoming venue deadlines.
- `app/dashboard/uniqueness|conferences|outline|coaching|readiness|deadlines|settings/` — module pages + server actions (each returns `ActionResult<T>`, never throws for expected failures).
- `lib/uniqueness/` — live search, embed, score, explain.
- `lib/conferences/` — seeded venues (`venues.ts`), embedding match + Groq path suggestion (`match.ts`), soonest-deadline helper (`upcoming.ts`).
- `lib/outline/`, `lib/coaching/`, `lib/readiness/` — Groq-backed stage engines (same structured-output + degrade-on-failure pattern).
- `lib/composio/`, `lib/deadlines/` — Composio SDK/connections, in-app milestones + Gmail/Calendar reminder sending.
- `lib/dashboard/` — Overview stats query + on-demand Groq topic suggestions.
- `lib/sessions.ts` — session list/load/update helpers.
- `lib/scoreBucketStyles.ts` — shared score-bucket → success/warning/danger class maps; use instead of hardcoding colors.
- `components/ui/` — design-system primitives, including `Select`/`Checkbox` (Radix) — prefer these over raw `<select>`/`<input type="checkbox">`.
- `supabase/migrations/001_init.sql` + `002_pipeline.sql` + `003_onboarding.sql` — base tables + pipeline JSONB columns + onboarding flag.
- Google OAuth is enabled (`GoogleSignInButton` calls `signInWithOAuth` directly; enable the Google provider in Supabase to use it).

See `ARCHITECTURE.md` for the full directory tree, data model, and diagrams.

## Phase roadmap (per README)

Setup · Auth shell · Uniqueness (live search) · Conference/outline/coaching/readiness · Deadlines (in-app + Composio) · Dashboard redesign (sidebar, Overview, onboarding) — **done**. Later: Stripe billing, deploy polish.
