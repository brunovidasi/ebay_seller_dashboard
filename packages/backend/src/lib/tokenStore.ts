import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { env } from "../config/env.js";

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  scopes: string[];
}

let cache: StoredTokens | null = null;

export async function loadTokens(): Promise<StoredTokens | null> {
  if (cache) return cache;
  try {
    const raw = await readFile(env.tokenStorePath, "utf-8");
    cache = JSON.parse(raw) as StoredTokens;
    return cache;
  } catch {
    return null;
  }
}

export async function saveTokens(tokens: StoredTokens): Promise<void> {
  cache = tokens;
  await mkdir(dirname(env.tokenStorePath), { recursive: true });
  await writeFile(env.tokenStorePath, JSON.stringify(tokens, null, 2), "utf-8");
}

export function isExpired(tokens: StoredTokens): boolean {
  return new Date(tokens.accessTokenExpiresAt).getTime() <= Date.now() + 30_000;
}

export async function clearTokens(): Promise<void> {
  cache = null;
  await rm(env.tokenStorePath, { force: true });
}
