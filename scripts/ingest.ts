/**
 * Optional bulk abstract corpus ingestion — not required for uniqueness scoring
 * (which uses live arXiv + Semantic Scholar search + Pinecone standalone embed).
 *
 * Kept as a placeholder if you later want an offline Pinecone index.
 * Run with: npm run ingest
 */

console.log(
  [
    "Ingest is optional and not implemented.",
    "Uniqueness scoring already works via live literature search.",
    "See plan.md / README for the live-search architecture.",
  ].join(" ")
);
