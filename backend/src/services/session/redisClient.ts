import Redis from "ioredis";
import { loadConfig } from "../../config/env";

let client: Redis | null = null;

export function getRedisClient(): Redis {
  if (client) return client;

  const { url } = loadConfig().redis;

  client = new Redis(url, {
    // Fail fast rather than buffering commands indefinitely if Redis is
    // unreachable — a chat request should error clearly, not hang.
    maxRetriesPerRequest: 2,
  });

  client.on("error", (error) => {
    console.error("Redis connection error:", error.message);
  });

  return client;
}
