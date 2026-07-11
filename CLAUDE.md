# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

ScholarPath is an AI research co-pilot for students — uniqueness scoring, conference matching, outline building, section coaching, and submission readiness checks. It's a Next.js 14 (App Router) app built in numbered phases; the codebase currently reflects **Phase 0 (setup scaffold)**, with most feature directories present as stubs to be filled in later phases.

## Commands

```bash
npm run dev            # Start dev server at http://localhost:3000
npm run build           # Production build
npm run lint            # ESLint (next/core-web-vitals + next/typescript)
npx tsc --noEmit        # Type-check only
npm run create-index    # Create the Pinecone serverless index (scripts/create-pinecone-index.ts)
npm run ingest          # Ingest paper abstracts into Pinecone (stub until Phase 2)
```

There is no test runner configured in this repo yet (no Jest/Vitest).

`npm install` currently requires `--legacy-peer-deps` — `@langchain/community`'s optional `stagehand` peer dependency conflicts with the pinned `zod` version. This is unrelated to app code; don't try to "fix" it by changing the `zod` version.

`create-index` and `ingest` run via `tsx --env-file=.env.local`, so they load `.env.local` directly rather than through Next.js's env handling — required env vars must be real values, not placeholders (see `lib/env.ts`).

## Environment

Copy `.env.example` to `.env.local` and fill in real keys before running anything that touches Groq, Pinecone, or Firebase:

- **Groq** — chat/explanations/coaching (`GROQ_API_KEY`, `GROQ_MODEL`)
- **Pinecone** — vector search over paper abstracts (`PINECONE_API_KEY`, `PINECONE_INDEX`, `PINECONE_HOST`). Index dimension must be 384 (default, local `@xenova/transformers` embeddings) or 1536 (OpenAI embeddings) — see `scripts/create-pinecone-index.ts`.
- **Firebase** — Auth, Firestore, Storage. Client config is the `NEXT_PUBLIC_FIREBASE_*` vars; `FIREBASE_SERVICE_ACCOUNT` is the full service-account JSON as a single-line string, used server-side by the Admin SDK.

`.env.local` (and any file matching `.env*`) is gitignored — never commit real keys. `.env.example` must stay placeholder-only and is intentionally tracked so `cp .env.example .env.local` works for a fresh clone.

`lib/env.ts` is the only place server-side env vars should be read from (`import { env } from "@/lib/env"`). It lazily validates on each getter access and throws if a var is missing or still holds a placeholder value (checked via substrings `"your-"` / `"here"` — keep example/placeholder values in `.env.example` consistent with that check). Client components must use `firebaseClientConfig` (also exported from `lib/env.ts`) rather than reading `NEXT_PUBLIC_*` vars directly.

## Architecture

- `app/` — Next.js App Router routes. Dark mode is forced at the root (`<html className="dark">`); theme tokens live in `app/globals.css` as CSS variables (`--background`, `--foreground`, `--card`, `--muted`, `--accent`).
- `lib/env.ts` — server-side env validation and the client-safe Firebase config (see above).
- `lib/firebase/client.ts` / `lib/firebase/admin.ts` — currently empty stubs (`export {}`); Firebase client/admin SDK wiring is Phase 1 work.
- `lib/llm/client.ts` — LangChain chat model factory (`createChatModel`) wrapping `ChatGroq`, configured from `lib/env.ts`. This is the intended entry point for any LLM call in the app — don't instantiate `ChatGroq` directly elsewhere.
- `lib/uniqueness/` — scoring engine, stub until Phase 3.
- `lib/conferences/` — venue matching, stub until Phase 4.
- `scripts/create-pinecone-index.ts` — idempotent: checks for an existing index by name before creating, and warns (doesn't fail) on a dimension mismatch rather than recreating.
- `scripts/ingest.ts` — corpus ingestion into Pinecone, stub until Phase 2.
- `functions/` — Cloud Functions, stub until Phase 8.
- `components/ui/` — shared UI primitives, currently empty.
- Path alias `@/*` resolves to the repo root (`tsconfig.json`).

## Phase roadmap

Phase 0 (this scaffold) is complete once `.env.local` is filled in and `npm run dev` renders the landing page. Phase 1 (next) wires the Firebase client + admin SDKs, adds Google sign-in + an auth guard, and builds the tabbed dashboard shell (Overview, Phases, Conferences, Uniqueness, Tech Stack). Later phases (numbered above per-directory) cover corpus ingestion, uniqueness scoring, conference matching, and Cloud Functions.
