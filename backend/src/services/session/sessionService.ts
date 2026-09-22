import { getRedisClient } from "./redisClient";
import { loadConfig } from "../../config/env";
import type { ChatMessage } from "../../types/agent";
import type { Session } from "../../types/session";
import type { StageId } from "../../types";

// Redis-backed (Phase 6) — was an in-memory Map through Phase 4/5. Same
// function signatures as before, so chatController didn't need to change;
// only the storage swapped. TTL is sliding: every updateSession call
// (i.e. every completed turn) resets it, so an abandoned conversation
// expires SESSION_TTL_SECONDS after its last activity, not its creation.
function sessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

export async function getOrCreateSession(sessionId: string): Promise<Session> {
  const redis = getRedisClient();
  const raw = await redis.get(sessionKey(sessionId));

  if (raw) {
    return JSON.parse(raw) as Session;
  }

  // Not persisted yet — only written on the first successful updateSession,
  // so a request that fails before completing a turn (bad Groq/Zoho call,
  // etc.) doesn't leave a half-initialized session behind.
  return {
    sessionId,
    stage: null,
    messages: [],
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
}

export async function updateSession(
  sessionId: string,
  update: { stage: StageId; messages: ChatMessage[] }
): Promise<Session> {
  const existing = await getOrCreateSession(sessionId);

  const session: Session = {
    ...existing,
    stage: update.stage,
    messages: update.messages,
    lastActiveAt: Date.now(),
  };

  const { sessionTtlSeconds } = loadConfig().redis;
  const redis = getRedisClient();
  await redis.set(sessionKey(sessionId), JSON.stringify(session), "EX", sessionTtlSeconds);

  return session;
}
