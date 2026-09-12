import type { BulkUpdateEntry, BulkUpdateResult, InventoryItem } from "shared";
import { env } from "../config/env.js";
import { ebayFetch } from "./client.js";

interface EbayInventoryItemResponse {
  sku: string;
  product?: { title?: string };
  availability?: { shipToLocationAvailability?: { quantity?: number } };
}

interface EbayOfferResponse {
  sku: string;
  listingId?: string;
  status?: string;
  pricingSummary?: { price?: { value?: string; currency?: string } };
}

/**
 * eBay's GET /offer only supports looking up offers for one SKU at a time (there's no
 * "list all offers" call), so this fetches the offer per inventory item's SKU.
 */
async function getOfferForSku(sku: string): Promise<EbayOfferResponse | undefined> {
  const response = await ebayFetch(`/sell/inventory/v1/offer?sku=${encodeURIComponent(sku)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch offer for SKU ${sku}: ${await response.text()}`);
  }
  const body = (await response.json()) as { offers?: EbayOfferResponse[] };
  return body.offers?.[0];
}

/**
 * Merges eBay's inventory items (stock/title) with their offers (price/listing status)
 * since the Inventory API splits "what it is" from "how it's listed" across two endpoints.
 */
export async function listInventoryItems(): Promise<InventoryItem[]> {
  const itemsRes = await ebayFetch("/sell/inventory/v1/inventory_item?limit=100");
  if (!itemsRes.ok) {
    throw new Error(`Failed to list inventory items: ${await itemsRes.text()}`);
  }
  const itemsBody = (await itemsRes.json()) as { inventoryItems?: EbayInventoryItemResponse[] };
  const items = itemsBody.inventoryItems ?? [];

  const offers = await Promise.all(items.map((item) => getOfferForSku(item.sku)));

  return items.map((item, index): InventoryItem => {
    const offer = offers[index];
    const quantity = item.availability?.shipToLocationAvailability?.quantity ?? 0;
    return {
      sku: item.sku,
      title: item.product?.title ?? "(untitled)",
      quantity,
      price: Number(offer?.pricingSummary?.price?.value ?? 0),
      currency: offer?.pricingSummary?.price?.currency ?? env.ebayCurrency,
      listingId: offer?.listingId,
      status: offer?.status === "PUBLISHED" ? (quantity > 0 ? "ACTIVE" : "OUT_OF_STOCK") : "UNKNOWN",
    };
  });
}

/**
 * Wraps eBay's own bulk_update_price_quantity endpoint, which lets you patch price
 * and/or quantity for up to 25 SKUs per call without touching the rest of the listing.
 */
export async function bulkUpdatePriceQuantity(
  updates: BulkUpdateEntry[],
): Promise<BulkUpdateResult[]> {
  const requests = updates.map((entry) => ({
    sku: entry.sku,
    shipToLocationAvailability:
      entry.quantity === undefined ? undefined : { quantity: entry.quantity },
    price:
      entry.price === undefined
        ? undefined
        : { value: String(entry.price), currency: env.ebayCurrency },
  }));

  const response = await ebayFetch("/sell/inventory/v1/bulk_update_price_quantity", {
    method: "POST",
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    throw new Error(`Bulk update failed: ${await response.text()}`);
  }

  const body = (await response.json()) as {
    responses?: { sku: string; statusCode: number; errors?: { message: string }[] }[];
  };

  return (body.responses ?? []).map((r) => ({
    sku: r.sku,
    success: r.statusCode >= 200 && r.statusCode < 300,
    error: r.errors?.map((e) => e.message).join("; "),
  }));
}
