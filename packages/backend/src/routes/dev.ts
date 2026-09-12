import { Router } from "express";
import type { SeedListingInput } from "shared";
import { env } from "../config/env.js";
import { createTestListing } from "../ebay/seed.js";

export const devRouter = Router();

devRouter.post("/seed-listing", async (req, res) => {
  if (env.ebayEnv !== "sandbox") {
    res.status(403).json({ error: "Seeding test listings is only allowed against the eBay sandbox." });
    return;
  }

  try {
    const result = await createTestListing(req.body as SeedListingInput);
    res.json(result);
  } catch (error) {
    res.status(502).json({ error: (error as Error).message });
  }
});
