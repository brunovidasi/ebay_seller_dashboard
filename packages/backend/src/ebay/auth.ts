import { ebayHosts, env } from "../config/env.js";
import { isExpired, loadTokens, saveTokens, type StoredTokens } from "../lib/tokenStore.js";

function basicAuthHeader(): string {
  const credentials = `${env.ebayClientId}:${env.ebayClientSecret}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

export function buildConsentUrl(state: string): string {
  if (!env.ebayRuName) {
    throw new Error(
      "EBAY_RU_NAME is not set. Configure a redirect URL (RuName) in the eBay Developer " +
        "Program under Application Keys > User Tokens before starting the login flow.",
    );
  }
  const params = new URLSearchParams({
    client_id: env.ebayClientId,
    redirect_uri: env.ebayRuName,
    response_type: "code",
    scope: env.ebayScopes,
    state,
  });
  return `${ebayHosts.auth}/oauth2/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type: string;
}

async function requestToken(body: URLSearchParams): Promise<TokenResponse> {
  const response = await fetch(`${ebayHosts.api}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: basicAuthHeader(),
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`eBay token request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as TokenResponse;
}

export async function exchangeCodeForTokens(code: string): Promise<StoredTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.ebayRuName,
  });

  const token = await requestToken(body);
  const tokens: StoredTokens = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? "",
    accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    scopes: env.ebayScopes.split(" "),
  };
  await saveTokens(tokens);
  return tokens;
}

async function refreshAccessToken(refreshToken: string): Promise<StoredTokens> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    scope: env.ebayScopes,
  });

  const token = await requestToken(body);
  const tokens: StoredTokens = {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? refreshToken,
    accessTokenExpiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
    scopes: env.ebayScopes.split(" "),
  };
  await saveTokens(tokens);
  return tokens;
}

/** Returns a valid user access token, refreshing it first if it has expired. */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  if (!isExpired(tokens)) return tokens.accessToken;
  if (!tokens.refreshToken) return null;
  const refreshed = await refreshAccessToken(tokens.refreshToken);
  return refreshed.accessToken;
}

export async function getAuthStatus(): Promise<{ connected: boolean; expiresAt?: string }> {
  const tokens = await loadTokens();
  if (!tokens) return { connected: false };
  return { connected: true, expiresAt: tokens.accessTokenExpiresAt };
}
