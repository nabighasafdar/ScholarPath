import { ChatGroq } from "@langchain/groq";
import { env } from "@/lib/env";

/** Shared Groq chat model for explanations, coaching, and checklists. */
export function createChatModel(options?: { temperature?: number }) {
  return new ChatGroq({
    apiKey: env.groqApiKey,
    model: env.groqModel,
    temperature: options?.temperature ?? 0.3,
  });
}
