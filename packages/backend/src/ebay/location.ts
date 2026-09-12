import { env } from "../config/env.js";
import { ebayFetch } from "./client.js";

const MERCHANT_LOCATION_KEY = "primary-warehouse";

/**
 * eBay won't publish an offer without a merchant inventory location. Creates a
 * placeholder one on first use if it doesn't exist yet — good enough for sandbox testing.
 */
export async function ensureMerchantLocation(): Promise<string> {
  const existing = await ebayFetch(
    `/sell/inventory/v1/location/${MERCHANT_LOCATION_KEY}`,
  );
  if (existing.ok) return MERCHANT_LOCATION_KEY;

  const created = await ebayFetch(`/sell/inventory/v1/location/${MERCHANT_LOCATION_KEY}`, {
    method: "POST",
    body: JSON.stringify({
      name: "Primary Warehouse",
      merchantLocationStatus: "ENABLED",
      locationTypes: ["WAREHOUSE"],
      location: {
        address: {
          addressLine1: "1 Test Street",
          city: "Sydney",
          stateOrProvince: "NSW",
          postalCode: "2000",
          country: env.ebayMarketplaceId === "EBAY_AU" ? "AU" : "US",
        },
      },
    }),
  });

  if (!created.ok && created.status !== 409) {
    throw new Error(`Failed to create merchant location: ${await created.text()}`);
  }

  return MERCHANT_LOCATION_KEY;
}
