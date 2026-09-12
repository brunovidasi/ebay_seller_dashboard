import { env } from "../config/env.js";
import { ebayFetchOrThrow } from "./client.js";

let cachedCategoryTreeId: string | undefined;

async function getDefaultCategoryTreeId(): Promise<string> {
  if (cachedCategoryTreeId) return cachedCategoryTreeId;

  const response = await ebayFetchOrThrow(
    `/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=${env.ebayMarketplaceId}`,
    undefined,
    "Failed to resolve category tree for marketplace",
  );
  const body = (await response.json()) as { categoryTreeId: string };
  cachedCategoryTreeId = body.categoryTreeId;
  return body.categoryTreeId;
}

/** Every offer needs a leaf category ID; this finds a plausible one from a free-text query. */
export async function suggestCategoryId(query: string): Promise<string> {
  const treeId = await getDefaultCategoryTreeId();
  const response = await ebayFetchOrThrow(
    `/commerce/taxonomy/v1/category_tree/${treeId}/get_category_suggestions?q=${encodeURIComponent(query)}`,
    undefined,
    `Failed to find a category for "${query}"`,
  );
  const body = (await response.json()) as {
    categorySuggestions?: { category: { categoryId: string; categoryName: string } }[];
  };
  const first = body.categorySuggestions?.[0];
  if (!first) {
    throw new Error(`eBay returned no category suggestions for "${query}"`);
  }
  return first.category.categoryId;
}
