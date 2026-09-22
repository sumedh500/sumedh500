import { useState } from "react";

const SESSION_STORAGE_KEY = "chat-session-id";

// Default from ARCHITECTURE.md §9: sessionId persists across a page
// refresh so the conversation resumes (the backend keeps full history
// server-side, keyed by this id — see Phase 4's sessionService).
function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // localStorage unavailable (private browsing, blocked storage, etc.)
    // — fall through to an in-memory id for this page load.
  }

  const fresh = crypto.randomUUID();

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, fresh);
  } catch {
    // Session just won't persist across a reload this time.
  }

  return fresh;
}

export function useSession(): string {
  const [sessionId] = useState(getOrCreateSessionId);
  return sessionId;
}
