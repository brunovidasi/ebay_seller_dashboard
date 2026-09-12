import type { SeedListingInput, SeedListingResult } from "shared";
import { env } from "../config/env.js";
import { ebayFetchOrThrow } from "./client.js";
import { ensureMerchantLocation } from "./location.js";
import { ensureBusinessPoliciesOptIn, getRequiredPolicyIds } from "./policies.js";
import { suggestCategoryId } from "./taxonomy.js";

/**
 * Creates a minimal published listing end-to-end (item -> offer -> publish), so there's
 * something to see on the Products page without hand-building a listing in the sandbox UI.
 */
export async function createTestListing(input: SeedListingInput): Promise<SeedListingResult> {
  const title = input.title?.trim() || `Test Widget ${new Date().toISOString().slice(0, 19)}`;
  const price = input.price ?? 19.99;
  const quantity = input.quantity ?? 3;
  const sku = `TEST-${Date.now()}`;

  const [locationKey, categoryId] = await Promise.all([
    ensureMerchantLocation(),
    suggestCategoryId(title),
  ]);

  await ensureBusinessPoliciesOptIn();
  const { fulfillmentPolicyId, returnPolicyId, paymentPolicyId } = await getRequiredPolicyIds();

  await ebayFetchOrThrow(
    `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        condition: "NEW",
        product: {
          title,
          description: `${title} — seeded for local dashboard testing.`,
          imageUrls: ["https://placehold.co/500x500.png?text=Test+Item"],
        },
        availability: { shipToLocationAvailability: { quantity } },
      }),
    },
    "Failed to create inventory item",
  );

  const offerResponse = await ebayFetchOrThrow(
    "/sell/inventory/v1/offer",
    {
      method: "POST",
      body: JSON.stringify({
        sku,
        marketplaceId: env.ebayMarketplaceId,
        format: "FIXED_PRICE",
        availableQuantity: quantity,
        categoryId,
        listingDescription: `${title} — seeded for local dashboard testing.`,
        listingPolicies: { fulfillmentPolicyId, returnPolicyId, paymentPolicyId },
        pricingSummary: { price: { value: String(price), currency: env.ebayCurrency } },
        merchantLocationKey: locationKey,
      }),
    },
    "Failed to create offer",
  );
  const { offerId } = (await offerResponse.json()) as { offerId: string };

  const publishResponse = await ebayFetchOrThrow(
    `/sell/inventory/v1/offer/${offerId}/publish/`,
    { method: "POST" },
    "Failed to publish offer",
  );
  const { listingId } = (await publishResponse.json()) as { listingId: string };

  return { sku, offerId, listingId };
}
