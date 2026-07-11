/**
 * Create the ScholarPath Pinecone integrated-embedding index (Phase 0).
 * Run with: npm run create-index
 *
 * Uses Pinecone's integrated inference: text goes in, embeddings come out server-side,
 * so no separate embedding provider or step is needed for ingest/query.
 */

import { Pinecone } from "@pinecone-database/pinecone";

const INDEX_NAME = process.env.PINECONE_INDEX ?? "scholarpath-abstracts";
const EMBED_MODEL = process.env.PINECONE_EMBED_MODEL ?? "llama-text-embed-v2";
const DIMENSION = Number(process.env.PINECONE_DIMENSIONS ?? "1024");
const METRIC = "cosine" as const;
const CLOUD = (process.env.PINECONE_CLOUD ?? "aws") as "aws" | "gcp" | "azure";
const REGION = process.env.PINECONE_REGION ?? "us-east-1";
const TEXT_FIELD = "text";

async function main() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey.includes("your-")) {
    console.error(
      "Set a real PINECONE_API_KEY in .env.local before running this script.",
    );
    process.exit(1);
  }

  const pc = new Pinecone({ apiKey });
  const existing = await pc.listIndexes();
  const found = existing.indexes?.find((idx) => idx.name === INDEX_NAME);

  if (found) {
    console.log(`Index "${INDEX_NAME}" already exists (dimension=${found.dimension}).`);
    return;
  }

  console.log(
    `Creating integrated-embedding index "${INDEX_NAME}" (model=${EMBED_MODEL}, dims=${DIMENSION}, metric=${METRIC}, ${CLOUD}/${REGION})...`,
  );

  await pc.createIndexForModel({
    name: INDEX_NAME,
    cloud: CLOUD,
    region: REGION,
    embed: {
      model: EMBED_MODEL,
      fieldMap: { text: TEXT_FIELD },
      metric: METRIC,
      dimension: DIMENSION,
    },
    waitUntilReady: true,
  });

  console.log(`Index "${INDEX_NAME}" is ready.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
