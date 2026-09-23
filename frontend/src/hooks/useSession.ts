import { useCallback, useState } from "react";

const SESSION_STORAGE_KEY = "chat-session-id";

function persistSessionId(id: string): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  } catch {
    // localStorage unavailable (private browsing, blocked storage, etc.)
    // — session just won't persist across a reload this time.
  }
}

// Default from ARCHITECTURE.md §9: sessionId persists across a page
// refresh so the conversation resumes (the backend keeps full history
// server-side, keyed by this id — see Phase 4's sessionService).
function getOrCreateSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
  } catch {
    // fall through to generating a fresh in-memory id
  }

  const fresh = crypto.randomUUID();
  persistSessionId(fresh);
  return fresh;
}

export function useSession(): { sessionId: string; startNewSession: () => void } {
  const [sessionId, setSessionId] = useState(getOrCreateSessionId);

  // Picking a different suggestion after a conversation has started needs
  // more than clearing the visible messages — the backend remembers the
  // whole conversation by sessionId (Phase 6's Redis-backed session
  // store), so continuing to reuse the same id would carry the old
  // stage/context into what should be a fresh topic. A new id gives the
  // backend a genuinely blank session on the next request.
  const startNewSession = useCallback(() => {
    const fresh = crypto.randomUUID();
    persistSessionId(fresh);
    setSessionId(fresh);
  }, []);

  return { sessionId, startNewSession };
}
