import { env } from "../config/env.js";
import { ebayFetch } from "./client.js";

/**
 * Auto-creating business policies means guessing marketplace-specific shipping-carrier
 * enums, which is exactly the kind of thing that silently breaks. Instead, this only opts
 * the account into policy management (safe, idempotent) and reads back whatever policies
 * already exist — sandbox test users can create a default set once via the Seller Hub.
 */
export async function ensureBusinessPoliciesOptIn(): Promise<void> {
  try {
    await ebayFetch("/sell/account/v1/program/opt_in", {
      method: "POST",
      body: JSON.stringify({ programType: "SELLING_POLICY_MANAGEMENT" }),
    });
  } catch {
    // Best-effort: if this fails (e.g. already opted in), the policy lookups below
    // will surface a clear error anyway if something is actually missing.
  }
}

interface RequiredPolicyIds {
  fulfillmentPolicyId: string;
  returnPolicyId: string;
  paymentPolicyId?: string;
}

async function firstPolicyId(
  path: string,
  listKey: string,
  idKey: string,
): Promise<string | undefined> {
  const response = await ebayFetch(
    `${path}?marketplace_id=${encodeURIComponent(env.ebayMarketplaceId)}`,
  );
  if (!response.ok) return undefined;
  const body = (await response.json()) as Record<string, unknown>;
  const list = body[listKey] as Array<Record<string, string>> | undefined;
  return list?.[0]?.[idKey];
}

export async function getRequiredPolicyIds(): Promise<RequiredPolicyIds> {
  const [fulfillmentPolicyId, returnPolicyId, paymentPolicyId] = await Promise.all([
    firstPolicyId("/sell/account/v1/fulfillment_policy", "fulfillmentPolicies", "fulfillmentPolicyId"),
    firstPolicyId("/sell/account/v1/return_policy", "returnPolicies", "returnPolicyId"),
    // Payment policies are optional on managed-payments marketplaces (which includes AU/US/UK/etc).
    firstPolicyId("/sell/account/v1/payment_policy", "paymentPolicies", "paymentPolicyId"),
  ]);

  const missing = [
    !fulfillmentPolicyId && "fulfillment",
    !returnPolicyId && "return",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `No ${missing.join(" and ")} policy found for marketplace ${env.ebayMarketplaceId}. ` +
        "Log into the eBay Sandbox Seller Hub as your sandbox test user, go to " +
        "Account > Business Policies (or the Shipping/Returns setup prompt for new sellers), " +
        "create a default policy of each type, then try again.",
    );
  }

  return {
    fulfillmentPolicyId: fulfillmentPolicyId!,
    returnPolicyId: returnPolicyId!,
    paymentPolicyId,
  };
}
