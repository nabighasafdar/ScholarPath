# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ScholarPath is an AI research co-pilot for students — uniqueness scoring, conference matching, outline building, section coaching, and submission readiness checks.

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

The app is Next.js 14 (App Router) with Supabase for auth/Postgres, Pinecone standalone embeddings for idea-vs-abstract similarity, live arXiv/Semantic Scholar search, and Groq (via LangChain) for explanations/coaching/outline/readiness. The early pipeline is shipped: uniqueness → conferences → outline → coaching → readiness → in-app deadlines.

## Commands

```bash
npm run dev            # Start dev server at http://localhost:3000
npm run build           # Production build
npm run lint            # ESLint (next/core-web-vitals + next/typescript)
npx tsc --noEmit        # Type-check only
npm run create-index    # Create/verify the Pinecone integrated-embedding index (scripts/create-pinecone-index.ts)
npm run ingest          # Ingest paper abstracts into Pinecone (stub until Phase 2)
```

There is no test runner configured in this repo yet (no Jest/Vitest).

`npm install` currently requires `--legacy-peer-deps` — `@langchain/community`'s optional `stagehand` peer dependency conflicts with the pinned `zod` version. This is unrelated to app code; don't try to "fix" it by changing the `zod` version.

`create-index` and `ingest` run via `tsx --env-file=.env.local`, so they load `.env.local` directly rather than through Next.js's env handling — required env vars must be real values, not placeholders (see `lib/env.ts`).

## Environment

Copy `.env.example` to `.env.local` and fill in real keys:

- **Groq** — chat/explanations/coaching (`GROQ_API_KEY`, `GROQ_MODEL`)
- **Pinecone** — standalone embedding for uniqueness (`PINECONE_API_KEY`). `PINECONE_INDEX` / `PINECONE_HOST` remain required by `lib/env.ts` for the optional index scripts but are unused by uniqueness scoring.
- **Supabase** — Auth + Postgres (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Run `supabase/migrations/001_init.sql` before testing auth/scoring end-to-end.
- **Semantic Scholar** (optional) — `SEMANTIC_SCHOLAR_API_KEY`; keyless works, a free key improves rate limits.

`.env.local` (and any file matching `.env*`) is gitignored — never commit real keys. `.env.example` must stay placeholder-only and is intentionally tracked so `cp .env.example .env.local` works for a fresh clone.

`lib/env.ts` is the only place server-side env vars should be read from (`import { env } from "@/lib/env"`). It lazily validates on each getter access and throws if a var is missing or still holds a placeholder value (checked via substrings `"your-"` / `"here"` — keep placeholder values in `.env.example` consistent with that check). Client components must use `supabaseClientConfig` (also exported from `lib/env.ts`) rather than reading `NEXT_PUBLIC_*` vars directly.

## Architecture

- `app/page.tsx` — landing page; links to `/dashboard` if already signed in, else `/login`.
- `app/login/page.tsx` — Google sign-in (redirects to `/dashboard` if already authenticated).
- `app/auth/callback/route.ts` — exchanges the Supabase OAuth `code` for a session, then redirects.
- `app/dashboard/layout.tsx` — auth gate, AuthProvider, pipeline nav, sign out.
- `app/dashboard/page.tsx` — stage overview cards (all live).
- `app/dashboard/uniqueness|conferences|outline|coaching|readiness|deadlines/` — module pages + server actions.
- `lib/uniqueness/` — live search, embed, score, explain.
- `lib/conferences/` — seeded venues + embedding match + Groq path suggestion.
- `lib/outline/`, `lib/coaching/`, `lib/readiness/` — Groq-backed stage engines.
- `lib/sessions.ts` — session list/load/update helpers.
- `supabase/migrations/001_init.sql` + `002_pipeline.sql` — base tables + pipeline JSONB columns.
- Google OAuth button calls `signInWithOAuth` (enable Google provider in Supabase to use it).

## Phase roadmap (per README)

0 Setup · 1 Auth shell · 2/3 Uniqueness (live search) · 4–7 Conference/outline/coaching/readiness · in-app deadlines — **done**. Later: Composio delivery, Stripe, deploy polish.
