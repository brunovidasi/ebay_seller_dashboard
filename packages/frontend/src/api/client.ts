import type {
  BulkUpdateRequest,
  BulkUpdateResult,
  EbayAuthStatus,
  InventoryItem,
  SeedListingInput,
  SeedListingResult,
} from "shared";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error ?? `Request to ${path} failed with ${response.status}`);
  }
  return body as T;
}

export const api = {
  getAuthStatus: () => request<EbayAuthStatus>("/ebay/auth/status"),
  getInventoryItems: () => request<{ items: InventoryItem[] }>("/inventory/items"),
  bulkUpdate: (body: BulkUpdateRequest) =>
    request<{ results: BulkUpdateResult[] }>("/inventory/items/bulk", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  seedListing: (body: SeedListingInput) =>
    request<SeedListingResult>("/dev/seed-listing", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
