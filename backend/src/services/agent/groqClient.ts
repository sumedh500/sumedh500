import Groq from "groq-sdk";
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
