import type { ChatMessage } from "../../types/agent";
import type { Session } from "../../types/session";
import type { StageId } from "../../types";

// In-memory for now — Phase 6 swaps this Map for Redis (with a TTL) behind
// this exact same function signatures, so the controller that calls these
// won't need to change. Trade-off accepted for now: restarting the
// backend loses every session, and this won't work across multiple
// backend instances. Fine for a single-process dev/demo setup; not fine
// once Phase 6's persistence requirement actually matters.
const sessions = new Map<string, Session>();

export function getOrCreateSession(sessionId: string): Session {
  const existing = sessions.get(sessionId);
  if (existing) return existing;

  const fresh: Session = {
    sessionId,
    stage: null,
    messages: [],
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
  sessions.set(sessionId, fresh);
  return fresh;
}

export function updateSession(sessionId: string, update: { stage: StageId; messages: ChatMessage[] }): Session {
  const session = getOrCreateSession(sessionId);
  session.stage = update.stage;
  session.messages = update.messages;
  session.lastActiveAt = Date.now();
  sessions.set(sessionId, session);
  return session;
}
