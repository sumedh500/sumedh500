import Redis from "ioredis";
import { loadConfig } from "../../config/env";

let client: Redis | null = null;
let hasLoggedConnectionError = false;

// Safe to print: host, port, and whether TLS is active — never the
// password. Helps spot a malformed REDIS_URL (e.g. an unencoded special
// character in the password corrupting the parsed host/port) without
// exposing the secret.
function describeConnectionTarget(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}:${parsed.port || "(default)"} (tls: ${parsed.protocol === "rediss:"})`;
  } catch {
    return "(unparseable REDIS_URL)";
  }
}

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

  console.log(`Connecting to Redis at ${describeConnectionTarget(url)}`);

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

  // MaxRetriesPerRequestError (the one you've been hitting) carries no
  // information about *why* commands never got a response — it fires
  // identically whether the TCP connect never completed, the TLS
  // handshake stalled, or auth failed silently. These lower-level
  // lifecycle events pinpoint which stage actually failed.
  client.on("connect", () => console.log("Redis: TCP connection established, authenticating..."));
  client.on("ready", () => {
    console.log("Redis: ready (connected and authenticated).");
    hasLoggedConnectionError = false;
  });
  client.on("reconnecting", (delay: number) => console.log(`Redis: reconnecting in ${delay}ms...`));
  client.on("end", () => console.log("Redis: connection closed, giving up (retry cap reached)."));

  client.on("error", (error) => {
    // Fires repeatedly during reconnect attempts — log the first
    // occurrence with the full hint, then stay quiet until it recovers
    // ('ready') to avoid flooding the console with the same message.
    if (hasLoggedConnectionError) return;
    hasLoggedConnectionError = true;

    console.error(
      `Redis connection error: ${error.message}\n` +
        "Check REDIS_URL in backend/.env — it must be the native connection string " +
        "(redis:// or rediss://), include the password, and any special characters in the " +
        "password must be URL-encoded (e.g. @ as %40) or they'll corrupt the parsed host/port. " +
        `See "Connecting to Redis at ..." above for what was actually parsed out of it.`
    );
  });

  return client;
}
