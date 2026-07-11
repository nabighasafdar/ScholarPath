import { Pinecone } from "@pinecone-database/pinecone";
import { env } from "@/lib/env";

const EMBED_MODEL = "llama-text-embed-v2";

let pinecone: Pinecone | null = null;

function getPinecone(): Pinecone {
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: env.pineconeApiKey });
  }
  return pinecone;
}

/** Batch-embed texts with Pinecone standalone inference (no index required). */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const pc = getPinecone();
  const result = await pc.inference.embed({
    model: EMBED_MODEL,
    inputs: texts,
    parameters: {
      inputType: "passage",
      truncate: "END",
    },
  });

  const vectors: number[][] = [];
  for (const item of result.data ?? []) {
    if ("values" in item && Array.isArray(item.values)) {
      vectors.push(item.values);
    } else {
      throw new Error("Pinecone embed returned a non-dense vector; expected dense values.");
    }
  }

  if (vectors.length !== texts.length) {
    throw new Error(
      `Pinecone embed count mismatch: expected ${texts.length}, got ${vectors.length}.`
    );
  }

  return vectors;
}
