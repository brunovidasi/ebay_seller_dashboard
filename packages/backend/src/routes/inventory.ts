import { Router } from "express";
import type { BulkUpdateRequest } from "shared";
import { bulkUpdatePriceQuantity, listInventoryItems } from "../ebay/inventory.js";

export const inventoryRouter = Router();

inventoryRouter.get("/items", async (_req, res) => {
  try {
    const items = await listInventoryItems();
    res.json({ items });
  } catch (error) {
    res.status(502).json({ error: (error as Error).message });
  }
});

inventoryRouter.patch("/items/bulk", async (req, res) => {
  const body = req.body as BulkUpdateRequest;
  if (!Array.isArray(body?.updates) || body.updates.length === 0) {
    res.status(400).json({ error: "Request body must include a non-empty 'updates' array." });
    return;
  }
  if (body.updates.length > 25) {
    res.status(400).json({ error: "eBay's bulk endpoint accepts at most 25 SKUs per call." });
    return;
  }

  try {
    const results = await bulkUpdatePriceQuantity(body.updates);
    res.json({ results });
  } catch (error) {
    res.status(502).json({ error: (error as Error).message });
  }
});
