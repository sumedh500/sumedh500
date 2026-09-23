import type { StageId } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface ChatResponse {
  sessionId: string;
  reply: string;
  stage: StageId;
}

export async function sendChatMessage(sessionId: string, message: string): Promise<ChatResponse> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = Array.isArray(body?.details) ? body.details.join(", ") : undefined;
    // `message` is the human-readable text for a specific error case (e.g.
    // rate_limit); `error` alone is just a short code ("rate_limit",
    // "Something went wrong...") — prefer the former when both are present.
    throw new Error(detail ?? body?.message ?? body?.error ?? `Request failed with status ${response.status}`);
  }

  return response.json();
}
