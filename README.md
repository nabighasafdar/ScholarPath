# ScholarPath

AI research co-pilot for students — uniqueness scoring, conference matching, outline building, section coaching, and submission readiness checks.

## Phase 0 — Setup checklist

### Your tasks (manual)

1. Create a [Groq](https://console.groq.com/keys) API key (chat / explanations)
2. Create a [Pinecone](https://www.pinecone.io) index named `scholarpath-abstracts` (dimensions must match your embedding model; cosine metric)
3. Create a [Firebase](https://console.firebase.google.com) project with Google Auth, Firestore, and Storage
4. Copy Firebase web config + download service account JSON
5. Fill in `.env.local` (Groq key is already set if you pasted it; still need Pinecone + Firebase):

```bash
cp .env.example .env.local
# Edit .env.local with your real keys
```

### Verify

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you should see the ScholarPath landing page.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run create-index` | Create Pinecone index `scholarpath-abstracts` (384 dims default) |
| `npm run ingest` | Ingest paper abstracts into Pinecone (Phase 2) |

## Tech stack

- **Next.js 14** (App Router + Server Actions)
- **Firebase** (Auth, Firestore, Storage)
- **LangChain** + **Groq** (chat / explanations / coaching)
- **Pinecone** (vector search over paper abstracts; embeddings via a separate provider in Phase 2)

## Project structure

```
app/                  # Next.js routes
lib/
  env.ts              # Environment validation
  firebase/           # Client + Admin SDK (Phase 1)
  uniqueness/         # Scoring engine (Phase 3)
  conferences/        # Venue matching (Phase 4)
  llm/                # LangChain chains
scripts/ingest.ts     # Corpus ingestion (Phase 2)
functions/            # Cloud Functions (Phase 8)
components/ui/        # Shared UI primitives
```

## What's next (Phase 1)

Once `.env.local` is filled and `npm run dev` works:

- Wire Firebase client + admin SDKs
- Google sign-in + auth guard
- Tabbed dashboard shell (Overview, Phases, Conferences, Uniqueness, Tech Stack)
