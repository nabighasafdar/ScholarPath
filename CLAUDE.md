# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

The app is Next.js 14 (App Router) with Supabase for auth (email/password + Google OAuth)/Postgres, Pinecone standalone embeddings for idea-vs-abstract and idea-vs-venue similarity, live arXiv/Semantic Scholar search, Groq (via LangChain) for explanations/coaching/outline/readiness/topic suggestions, and Composio for real Gmail/Google Calendar deadline reminders. The full pipeline is shipped: uniqueness → conferences → outline → coaching → readiness → deadlines (in-app + Composio email/calendar). The dashboard has a persistent sidebar (not tabs), a stats/charts Overview page, and a 2-step onboarding flow gated on `profiles.onboarding_completed_at`.

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

`.npmrc` sets `legacy-peer-deps=true` — `@langchain/community`'s optional `stagehand` peer dependency conflicts with the pinned `zod` version. This is unrelated to app code; don't try to "fix" it by changing the `zod` version, and don't remove the `.npmrc` setting.

`create-index`, `ingest`, and `test:composio` run via `tsx --env-file=.env.local`, so they load `.env.local` directly rather than through Next.js's env handling — required env vars must be real values, not placeholders (see `lib/env.ts`).

## Environment

Copy `.env.example` to `.env.local` and fill in real keys:

- **Groq** — chat/explanations/coaching/topic suggestions (`GROQ_API_KEY`, `GROQ_MODEL`)
- **Pinecone** — standalone embedding for uniqueness + conference matching (`PINECONE_API_KEY`). `PINECONE_INDEX` / `PINECONE_HOST` remain required by `lib/env.ts` for the optional index scripts but are unused by uniqueness scoring itself.
- **Supabase** — Auth + Postgres (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Run all three migrations (`supabase/migrations/001_init.sql`, `002_pipeline.sql`, `003_onboarding.sql`) before testing end-to-end.
- **Semantic Scholar** (optional) — `SEMANTIC_SCHOLAR_API_KEY`; keyless works, a free key improves rate limits.
- **Composio** (optional) — `COMPOSIO_API_KEY` enables Gmail/Calendar deadline reminders (Settings + onboarding connect flow); `COMPOSIO_TIMEZONE` (default `Asia/Karachi`); `CRON_SECRET` gates `/api/cron/deadline-reminders`. Without `COMPOSIO_API_KEY`, Settings/onboarding show "not connected" but nothing else breaks.

`.env.local` (and any file matching `.env*`) is gitignored — never commit real keys. `.env.example` must stay placeholder-only and is intentionally tracked so `cp .env.example .env.local` works for a fresh clone.

`lib/env.ts` is the only place server-side env vars should be read from (`import { env } from "@/lib/env"`). It lazily validates on each getter access and throws if a required var is missing or still holds a placeholder value (checked via substrings `"your-"` / `"here"` — keep placeholder values in `.env.example` consistent with that check). Optional vars (Semantic Scholar, Composio) return `undefined` instead of throwing. Client components must use `supabaseClientConfig` (also exported from `lib/env.ts`) rather than reading `NEXT_PUBLIC_*` vars directly.

## Architecture

- `app/page.tsx` — landing page; links to `/dashboard` if already signed in, else `/login`.
- `app/login/page.tsx`, `app/signup/page.tsx` — email/password + Google sign-in/sign-up.
- `app/auth/callback/route.ts` — exchanges the Supabase OAuth `code` for a session, then redirects.
- `app/onboarding/` — 2-step post-signup flow (`OnboardingFlow`: product tour → connect Gmail/Calendar), gated by `profiles.onboarding_completed_at`; `completeOnboarding` action marks it done. `app/dashboard/layout.tsx` redirects here if incomplete, **fail-open** if the column/migration isn't present yet.
- `app/composio/callback/page.tsx` — OAuth popup landing page for Composio connect.
- `app/api/cron/deadline-reminders/route.ts` — daily cron (`Authorization: Bearer $CRON_SECRET`) that emails due reminders across all users via the service-role client.
- `app/dashboard/layout.tsx` — auth gate + onboarding gate, `AuthProvider`, `Sidebar` (persistent left nav, not tabs).
- `app/dashboard/page.tsx` + `app/dashboard/actions.ts` — Overview: real stats (`lib/dashboard/stats.ts`), score-trend chart, pipeline-completion tally, AI topic suggestions (`suggestTopics` action), upcoming venue deadlines.
- `app/dashboard/uniqueness|conferences|outline|coaching|readiness|deadlines|settings/` — module pages + server actions, each returning `ActionResult<T>` (`lib/action-result.ts`) and never throwing for expected failures.
- `lib/uniqueness/` — live search, embed, score, explain.
- `lib/conferences/` — `venues.ts` (seeded list), `match.ts` (embedding match + Groq path suggestion), `upcoming.ts` (soonest-deadline helper, pure/no I/O).
- `lib/outline/`, `lib/coaching/`, `lib/readiness/` — Groq-backed stage engines, same `createChatModel().withStructuredOutput(zodSchema)` + degrade-on-failure pattern throughout.
- `lib/composio/` — `client.ts` (SDK factory), `connections.ts` (connect/list/disconnect, auto-creates Auth Configs).
- `lib/deadlines/` — `milestones.ts` (in-app countdown), `reminders.ts` (Composio email/calendar sending).
- `lib/dashboard/` — `stats.ts` (Overview data from Supabase), `topicSuggestions.ts` (Groq call, only triggered on demand, not on every page load).
- `lib/sessions.ts` — `requireUser()` + `paper_sessions` list/load/update helpers.
- `lib/scoreBucketStyles.ts` — shared green/yellow/red → `success`/`warning`/`danger` Tailwind class maps; use these instead of hardcoding `red-400`/`green-500`/etc. anywhere a score bucket or status needs color.
- `components/ui/` — design-system primitives (`Button`, `Card`, `Badge`, `Input`, `Label`, `Textarea`, `Select`, `Checkbox`). Use `Select`/`Checkbox` instead of raw `<select>`/`<input type="checkbox">` for any new form control.
- `components/dashboard/` — `Sidebar`, `StatTile`, `ScoreTrendChart` (recharts), `PipelineProgress`, `TopicSuggestions`, `UpcomingDeadlines`, `SessionSelect`, `DashboardModuleShell`.
- `components/icons/AppLogos.tsx` — Gmail/Google Calendar icon tiles (hand-drawn SVG, not raw brand assets) used in Settings and onboarding.
- `supabase/migrations/001_init.sql` + `002_pipeline.sql` + `003_onboarding.sql` — base tables, pipeline JSONB columns, onboarding flag. Run all three on a fresh project, in order.
- Google OAuth is **enabled** — `GoogleSignInButton` calls `signInWithOAuth` directly; the Google provider must be enabled in Supabase with redirect URL `http://localhost:3000/auth/callback` (or the deployed equivalent).

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full directory tree, data model, rendering-model table, and Mermaid diagrams.

## Phase roadmap (per README)

Setup · Auth shell (email/password + Google) · Uniqueness (live search) · Conference/outline/coaching/readiness · Deadlines (in-app + Composio Gmail/Calendar) · Dashboard redesign (sidebar, Overview stats/charts, onboarding) — **done**. Later: Stripe billing, deploy polish, richer attempt-history views.
