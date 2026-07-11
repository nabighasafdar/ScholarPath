# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ScholarPath is an AI research co-pilot for students — uniqueness scoring, conference matching, outline building, section coaching, and submission readiness checks.

```
2-sentence idea
    → Pinecone integrated embed + nearest-neighbor search
    → uniquenessScore = 100 − avg(top-5 cosine similarity) × 100
    → Groq (via LangChain) explains overlap vs novelty
    → student iterates
    → session saved in Supabase Postgres
```

Score buckets: `≥70` green (publish-worthy) · `40–69` yellow · `<40` red (too close — iterate).

The app is Next.js 14 (App Router) with Supabase for auth/Postgres, Pinecone (integrated embeddings) for similarity search, and Groq (via LangChain) for explanations/coaching. Phase 0 (setup) and the Phase 1 auth shell (Google sign-in, protected dashboard, middleware guard) are done; the tabbed dashboard UI and Phases 2+ (ingest, uniqueness scoring, conference matching, etc.) are still ahead.

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
- **Pinecone** — integrated-embedding index over paper abstracts (`PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_HOST`). The index must use model `llama-text-embed-v2`, dimension `1024`, metric `cosine`, field map `text` — `scripts/create-pinecone-index.ts` creates it with these settings via `createIndexForModel`.
- **Supabase** — Google Auth + Postgres (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). Run `supabase/migrations/001_init.sql` against the project before testing auth end-to-end, and enable the Google provider (Authentication → Providers → Google) with redirect URL `http://localhost:3000/auth/callback`.

`.env.local` (and any file matching `.env*`) is gitignored — never commit real keys. `.env.example` must stay placeholder-only and is intentionally tracked so `cp .env.example .env.local` works for a fresh clone.

`lib/env.ts` is the only place server-side env vars should be read from (`import { env } from "@/lib/env"`). It lazily validates on each getter access and throws if a var is missing or still holds a placeholder value (checked via substrings `"your-"` / `"here"` — keep placeholder values in `.env.example` consistent with that check). Client components must use `supabaseClientConfig` (also exported from `lib/env.ts`) rather than reading `NEXT_PUBLIC_*` vars directly.

## Architecture

- `app/page.tsx` — landing page; links to `/dashboard` if already signed in, else `/login`.
- `app/login/page.tsx` — Google sign-in (redirects to `/dashboard` if already authenticated).
- `app/auth/callback/route.ts` — exchanges the Supabase OAuth `code` for a session, then redirects.
- `app/dashboard/page.tsx` — protected entry point (server-side `redirect("/login")` if unauthenticated); currently a basic shell, not yet the full tabbed UI (Overview · Phases · Conferences · Uniqueness · Tech stack).
- `middleware.ts` — refreshes the Supabase session cookie on every request and redirects unauthenticated requests to `/dashboard/*` back to `/login`. Route matching is config-driven (`PROTECTED_PREFIXES`), not per-route checks.
- `lib/supabase/client.ts` — browser client (`createBrowserClient`), for Client Components only.
- `lib/supabase/server.ts` — server client (`createServerClient` + `next/headers` cookies), for Server Components/Actions/Route Handlers. Next 14's `cookies()` is synchronous — don't `await` it here.
- `lib/supabase/admin.ts` — service-role client (`createAdminClient`) that bypasses RLS. Server-only; never import into a Client Component.
- `components/auth/` — `AuthProvider` (client context wrapping Supabase auth state, seeded from a server-fetched `initialUser`), `GoogleSignInButton`, `SignOutButton`.
- `lib/env.ts` — server-side env validation and the client-safe Supabase config (see above).
- `lib/llm/client.ts` — LangChain chat model factory (`createChatModel`) wrapping `ChatGroq`, configured from `lib/env.ts`. This is the intended entry point for any LLM call in the app — don't instantiate `ChatGroq` directly elsewhere.
- `lib/uniqueness/` — scoring engine, stub until Phase 3 (`score.ts`, `explain.ts` per the README's plan).
- `lib/conferences/` — venue matching, stub until Phase 4.
- `scripts/create-pinecone-index.ts` — idempotent (checks for an existing index by name before creating); uses `createIndexForModel` for integrated embedding, not a raw-vector index.
- `scripts/ingest.ts` — corpus ingestion into Pinecone (Semantic Scholar + arXiv), stub until Phase 2.
- `supabase/migrations/001_init.sql` — `profiles` (auto-created via an `on_auth_user_created` trigger), `paper_sessions`, `score_attempts`, all with RLS restricting rows to their owning user.
- `components/ui/` — shared UI primitives, currently empty.
- Path alias `@/*` resolves to the repo root (`tsconfig.json`).
- Dark mode is forced at the root (`<html className="dark">`); theme tokens live in `app/globals.css` as CSS variables (`--background`, `--foreground`, `--card`, `--muted`, `--accent`).

## Phase roadmap (per README)

0 Project setup (done) · 1 Auth + app shell (Google sign-in, protected dashboard, middleware guard — done; full 5-tab dashboard UI still to build) · 2 Abstract corpus + Pinecone ingest · 3 Uniqueness engine (MVP centerpiece) · 4 Conference matching · 5 Outline builder · 6 Section coaching · 7 Submission readiness · 8 Deadline reminders · 9 Polish/billing/deploy.
