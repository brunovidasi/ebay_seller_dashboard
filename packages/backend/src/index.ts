import cors from "cors";
import express from "express";
import { existsSync, readFileSync } from "node:fs";
import { createServer as createHttpsServer } from "node:https";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { inventoryRouter } from "./routes/inventory.js";
import { healthRouter } from "./routes/health.js";
import { devRouter } from "./routes/dev.js";

const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/ebay/auth", authRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/dev", devRouter);

const hasTlsCert = existsSync(env.tlsKeyPath) && existsSync(env.tlsCertPath);

// eBay's RuName config requires an https:// redirect URL, so the OAuth callback
// must be served over TLS even in local dev. Run `npm run dev` (which generates
// a self-signed cert via scripts/gen-cert.sh) rather than hitting this fallback.
if (hasTlsCert) {
  createHttpsServer(
    { key: readFileSync(env.tlsKeyPath), cert: readFileSync(env.tlsCertPath) },
    app,
  ).listen(env.port, () => {
    console.log(`Backend listening on https://localhost:${env.port} (eBay env: ${env.ebayEnv})`);
    console.log("Self-signed cert: your browser will warn on first visit, that's expected.");
  });
} else {
  console.warn(
    `No dev TLS cert found at ${env.tlsCertPath} — falling back to plain HTTP. ` +
      "The eBay OAuth callback needs HTTPS; run 'npm run dev' from the repo root or " +
      "'bash scripts/gen-cert.sh' in packages/backend to generate one.",
  );
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port} (eBay env: ${env.ebayEnv})`);
  });
}
