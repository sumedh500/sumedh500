import Groq, { RateLimitError } from "groq-sdk";
import { loadConfig } from "../../config/env";

let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (client) return client;

  const config = loadConfig();
  if (!config.groq.apiKey) {
    throw new Error("Missing GROQ_API_KEY in backend/.env (get a free key at console.groq.com).");
  }

  client = new Groq({ apiKey: config.groq.apiKey });
  return client;
}

export function getGroqModel(): string {
  return loadConfig().groq.model;
}

// Every Groq call in this project goes through this rather than calling
// client.chat.completions.create directly. On a RateLimitError for the
// primary model (free-tier daily token caps are per-model, not per
// account — this is what actually happens when a demo/testing session
// burns through the day's quota), it retries the exact same call once
// against the configured fallback model instead of failing the turn.
// `attempt` takes the model to use rather than this returning one,
// because the request body itself can differ per call site (e.g. the
// classifier's reasoning_effort/max_tokens), not just the `model` field.
export async function withGroqFallback<T>(attempt: (model: string) => Promise<T>): Promise<T> {
  const { model: primaryModel, fallbackModel } = loadConfig().groq;

  try {
    return await attempt(primaryModel);
  } catch (error) {
    if (error instanceof RateLimitError && fallbackModel && fallbackModel !== primaryModel) {
      console.warn(`Groq rate limit on "${primaryModel}" — retrying this call with fallback model "${fallbackModel}".`);
      return attempt(fallbackModel);
    }
    throw error;
  }
}
