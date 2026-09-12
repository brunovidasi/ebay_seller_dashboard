import { ebayHosts, env } from "../config/env.js";
import { getValidAccessToken } from "./auth.js";

export async function ebayFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    throw new Error("Not connected to eBay yet. Visit /api/ebay/auth/login first.");
  }

  return fetch(`${ebayHosts.api}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Content-Language": env.ebayContentLanguage,
      "Accept-Language": env.ebayContentLanguage,
      "X-EBAY-C-MARKETPLACE-ID": env.ebayMarketplaceId,
    },
  });
}

export async function ebayFetchOrThrow(
  path: string,
  init: RequestInit | undefined,
  errorPrefix: string,
): Promise<Response> {
  const response = await ebayFetch(path, init);
  if (!response.ok) {
    throw new Error(`${errorPrefix}: ${await response.text()}`);
  }
  return response;
}
