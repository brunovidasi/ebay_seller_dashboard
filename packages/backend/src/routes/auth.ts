import { Router } from "express";
import { randomBytes } from "node:crypto";
import { buildConsentUrl, exchangeCodeForTokens, getAuthStatus } from "../ebay/auth.js";
import { env } from "../config/env.js";

export const authRouter = Router();

authRouter.get("/login", (_req, res) => {
  try {
    const state = randomBytes(16).toString("hex");
    const url = buildConsentUrl(state);
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

authRouter.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (typeof code !== "string") {
    res.status(400).json({ error: "Missing 'code' query parameter from eBay redirect." });
    return;
  }

  try {
    await exchangeCodeForTokens(code);
    res.redirect(`${env.frontendUrl}/?connected=1`);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

authRouter.get("/status", async (_req, res) => {
  res.json(await getAuthStatus());
});
