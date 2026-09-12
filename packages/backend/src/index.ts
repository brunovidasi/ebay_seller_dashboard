import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.js";
import { inventoryRouter } from "./routes/inventory.js";
import { healthRouter } from "./routes/health.js";

const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/ebay/auth", authRouter);
app.use("/api/inventory", inventoryRouter);

app.listen(env.port, () => {
  console.log(`Backend listening on http://localhost:${env.port} (eBay env: ${env.ebayEnv})`);
});
