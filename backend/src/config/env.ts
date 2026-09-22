import "dotenv/config";

export interface AppConfig {
  port: number;
  nodeEnv: string;
  groq: {
    apiKey: string;
    model: string;
  };
  redis: {
    url: string;
    sessionTtlSeconds: number;
  };
  zoho: {
    dataCenter: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  mongo: {
    uri: string | undefined;
    enabled: boolean;
  };
}

// Phase 1.3 scaffolding: reads env vars with sane defaults. Validation
// (e.g. throwing on missing Zoho/Groq secrets) will be tightened once
// those services are actually wired in Phase 2/3.
export function loadConfig(): AppConfig {
  return {
    port: Number(process.env.PORT ?? 4000),
    nodeEnv: process.env.NODE_ENV ?? "development",
    groq: {
      apiKey: process.env.GROQ_API_KEY ?? "",
      // llama-3.3-70b-versatile was decommissioned by Groq (Aug 2026); this
      // is Groq's own recommended replacement for tool-calling workloads.
      model: process.env.GROQ_MODEL ?? "openai/gpt-oss-120b",
    },
    redis: {
      url: process.env.REDIS_URL ?? "redis://localhost:6379",
      sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 1800),
    },
    zoho: {
      dataCenter: process.env.ZOHO_DC ?? "com",
      clientId: process.env.ZOHO_CLIENT_ID ?? "",
      clientSecret: process.env.ZOHO_CLIENT_SECRET ?? "",
      refreshToken: process.env.ZOHO_REFRESH_TOKEN ?? "",
    },
    mongo: {
      uri: process.env.MONGO_URI,
      enabled: process.env.MONGO_ENABLED === "true",
    },
  };
}
