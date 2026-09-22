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
    throw new Error(detail ?? body?.error ?? `Request failed with status ${response.status}`);
  }

  return response.json();
}
