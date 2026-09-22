import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { loadConfig } from "../../config/env";

const CRM_API_VERSION = "v6";

// Refresh this many ms before the token's real expiry, so an in-flight
// request never gets handed a token that dies mid-flight.
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

interface TokenState {
  accessToken: string;
  expiresAt: number; // epoch ms
  apiDomain: string;
}

// Module-level singleton: one token, shared by every caller in this
// process, refreshed lazily. See the explanation in PROGRESS.md / the
// Phase 2 write-up for why (short version: access tokens last ~1hr and
// Zoho rate-limits the token endpoint, so refreshing per-request would be
// both wasteful and eventually rejected).
let tokenState: TokenState | null = null;
let refreshInFlight: Promise<TokenState> | null = null;

function accountsBaseUrl(dataCenter: string): string {
  return `https://accounts.zoho.${dataCenter}`;
}

async function refreshAccessToken(): Promise<TokenState> {
  const config = loadConfig();
  const { clientId, clientSecret, refreshToken, dataCenter } = config.zoho;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Zoho OAuth credentials. Set ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET and ZOHO_REFRESH_TOKEN " +
        "(generate the refresh token once with backend/scripts/zoho-get-refresh-token.ts)."
    );
  }

  const response = await axios.post(`${accountsBaseUrl(dataCenter)}/oauth/v2/token`, null, {
    params: {
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    },
  });

  const { access_token, expires_in, api_domain } = response.data ?? {};

  if (!access_token) {
    throw new Error(`Zoho token refresh failed: ${JSON.stringify(response.data)}`);
  }

  const state: TokenState = {
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000,
    apiDomain: api_domain ?? `https://www.zohoapis.${dataCenter}`,
  };

  tokenState = state;
  return state;
}

// Single-flight refresh: if five requests all see an expired token in the
// same tick, they share one POST to the token endpoint instead of firing
// five (Zoho's token endpoint is rate-limited per client).
async function getValidToken(): Promise<TokenState> {
  if (tokenState && Date.now() < tokenState.expiresAt - REFRESH_BUFFER_MS) {
    return tokenState;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

let client: AxiosInstance | null = null;

/**
 * Lazily-constructed axios instance for the Zoho CRM API. Every request
 * gets a fresh-enough access token injected and its baseURL pointed at the
 * DC-correct api_domain Zoho returned with that token. A 401 (token
 * revoked/expired despite our bookkeeping — e.g. someone regenerated the
 * refresh token in the Zoho console) forces one real refresh and one retry
 * before giving up.
 */
export function getZohoClient(): AxiosInstance {
  if (client) return client;

  client = axios.create();

  client.interceptors.request.use(async (requestConfig: InternalAxiosRequestConfig) => {
    const { accessToken, apiDomain } = await getValidToken();
    requestConfig.baseURL = `${apiDomain}/crm/${CRM_API_VERSION}`;
    requestConfig.headers.set("Authorization", `Zoho-oauthtoken ${accessToken}`);
    return requestConfig;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
      const isAuthError = error.response?.status === 401 && original && !original._retried;

      if (!isAuthError || !original) {
        return Promise.reject(error);
      }

      original._retried = true;
      tokenState = null; // discard the cached token, force a real refresh
      const { accessToken, apiDomain } = await getValidToken();
      original.baseURL = `${apiDomain}/crm/${CRM_API_VERSION}`;
      original.headers.set("Authorization", `Zoho-oauthtoken ${accessToken}`);
      return client!.request(original);
    }
  );

  return client;
}

/**
 * One-time exchange of a Self Client "grant token" (generated manually in
 * the Zoho API Console) for a refresh token. Not used by the running
 * backend — only by scripts/zoho-get-refresh-token.ts during setup.
 */
export async function exchangeGrantTokenForRefreshToken(params: {
  grantToken: string;
  clientId: string;
  clientSecret: string;
  dataCenter: string;
}): Promise<{ access_token: string; refresh_token: string; expires_in: number; api_domain: string }> {
  const { grantToken, clientId, clientSecret, dataCenter } = params;

  const response = await axios.post(`${accountsBaseUrl(dataCenter)}/oauth/v2/token`, null, {
    params: {
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code: grantToken,
    },
  });

  if (!response.data?.refresh_token) {
    throw new Error(`Grant token exchange failed: ${JSON.stringify(response.data)}`);
  }

  return response.data;
}
