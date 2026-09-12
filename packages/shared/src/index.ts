export interface InventoryItem {
  sku: string;
  title: string;
  quantity: number;
  price: number;
  currency: string;
  listingId?: string;
  status: "ACTIVE" | "ENDED" | "OUT_OF_STOCK" | "UNKNOWN";
}

export interface BulkUpdateEntry {
  sku: string;
  price?: number;
  quantity?: number;
}

export interface BulkUpdateRequest {
  updates: BulkUpdateEntry[];
}

export interface BulkUpdateResult {
  sku: string;
  success: boolean;
  error?: string;
}

export interface EbayAuthStatus {
  connected: boolean;
  expiresAt?: string;
}

export interface SeedListingInput {
  title?: string;
  price?: number;
  quantity?: number;
}

export interface SeedListingResult {
  sku: string;
  offerId: string;
  listingId: string;
}
