import Redis from "ioredis";
import { loadConfig } from "../../config/env";

let client: Redis | null = null;
let hasLoggedConnectionError = false;

export function getRedisClient(): Redis {
  if (client) return client;

  const { url } = loadConfig().redis;

  if (/^https?:\/\//i.test(url)) {
    throw new Error(
      "REDIS_URL looks like an HTTP(S) URL, not a Redis connection string. " +
        "If you're using Upstash: copy the native \"Redis Connect URL\" (starts with rediss://) " +
        "from the ioredis/Node tab, not the REST API URL/token — ioredis speaks the native Redis " +
        "protocol over TCP, not Upstash's HTTP REST API."
    );
  }

  client = new Redis(url, {
    // Fail fast per-request rather than buffering commands indefinitely
    // if Redis is unreachable — a chat request should error clearly, not
    // hang. Separate from the reconnect cap below.
    maxRetriesPerRequest: 2,
    // Cap background reconnect attempts instead of retrying forever (the
    // default): after ~5 failed attempts with increasing backoff, stop and
    // surface a real error rather than spamming identical log lines.
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 300, 3000);
    },
  });

  client.on("error", (error) => {
    // ioredis emits 'error' repeatedly during reconnect attempts — log the
    // first occurrence with a full hint, then stay quiet until it either
    // recovers ('ready') or gives up ('end') to avoid flooding the console
    // with the same message on every retry.
    if (hasLoggedConnectionError) return;
    hasLoggedConnectionError = true;

    console.error(
      `Redis connection error: ${error.message}\n` +
        "Check REDIS_URL in backend/.env — for a hosted Redis (e.g. Upstash), it must be the " +
        "native connection string starting with redis:// or rediss://, not an HTTP(S) URL, " +
        "and must include the password (usually as part of the URL, e.g. " +
        "rediss://default:<password>@<host>:<port>)."
    );
  });

  client.on("ready", () => {
    hasLoggedConnectionError = false;
  });

  return client;
}
