/**
 * Create the ScholarPath Pinecone serverless index (Phase 0).
 * Run with: npx tsx --env-file=.env.local scripts/create-pinecone-index.ts
 *
 * Defaults to 384 dims (free local @xenova/transformers embeddings).
 * Override: PINECONE_DIMENSIONS=1536 for OpenAI embeddings.
 */

import { Pinecone } from "@pinecone-database/pinecone";

const INDEX_NAME = process.env.PINECONE_INDEX ?? "scholarpath-abstracts";
const DIMENSIONS = Number(process.env.PINECONE_DIMENSIONS ?? "384");
const METRIC = "cosine" as const;
const CLOUD = (process.env.PINECONE_CLOUD ?? "aws") as "aws" | "gcp" | "azure";
const REGION = process.env.PINECONE_REGION ?? "us-east-1";

async function main() {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey || apiKey.includes("your-key-here")) {
    console.error(
      "Set a real PINECONE_API_KEY in .env.local before running this script.",
    );
    process.exit(1);
  }

  if (DIMENSIONS !== 384 && DIMENSIONS !== 1536) {
    console.error("PINECONE_DIMENSIONS must be 384 or 1536.");
    process.exit(1);
  }

  const pc = new Pinecone({ apiKey });
  const existing = await pc.listIndexes();
  const found = existing.indexes?.find((idx) => idx.name === INDEX_NAME);

  if (found) {
    const dim = found.dimension;
    console.log(`Index "${INDEX_NAME}" already exists (dimension=${dim}).`);
    if (dim !== DIMENSIONS) {
      console.warn(
        `Warning: existing dimension ${dim} != requested ${DIMENSIONS}. Recreate the index if this is wrong.`,
      );
    }
    return;
  }

  console.log(
    `Creating serverless index "${INDEX_NAME}" (dims=${DIMENSIONS}, metric=${METRIC}, ${CLOUD}/${REGION})...`,
  );

  await pc.createIndex({
    name: INDEX_NAME,
    dimension: DIMENSIONS,
    metric: METRIC,
    spec: {
      serverless: {
        cloud: CLOUD,
        region: REGION,
      },
    },
    waitUntilReady: true,
  });

  console.log(`Index "${INDEX_NAME}" is ready.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
