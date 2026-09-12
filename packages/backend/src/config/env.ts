import "dotenv/config";

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  ebayEnv: (process.env.EBAY_ENV === "production" ? "production" : "sandbox") as
    | "sandbox"
    | "production",
  ebayClientId: required("EBAY_CLIENT_ID", process.env.EBAY_CLIENT_ID),
  ebayClientSecret: required("EBAY_CLIENT_SECRET", process.env.EBAY_CLIENT_SECRET),
  ebayDevId: process.env.EBAY_DEV_ID ?? "",
  ebayRuName: process.env.EBAY_RU_NAME ?? "",
  ebayScopes: process.env.EBAY_SCOPES ?? "https://api.ebay.com/oauth/api_scope",
  ebayMarketplaceId: process.env.EBAY_MARKETPLACE_ID ?? "EBAY_AU",
  ebayCurrency: process.env.EBAY_CURRENCY ?? "AUD",
  ebayContentLanguage: process.env.EBAY_CONTENT_LANGUAGE ?? "en-AU",
  port: Number(process.env.PORT ?? 4000),
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  tokenStorePath: process.env.TOKEN_STORE_PATH ?? ".data/ebay-tokens.json",
  tlsKeyPath: process.env.TLS_KEY_PATH ?? "certs/localhost-key.pem",
  tlsCertPath: process.env.TLS_CERT_PATH ?? "certs/localhost-cert.pem",
};

export const ebayHosts =
  env.ebayEnv === "production"
    ? {
        api: "https://api.ebay.com",
        auth: "https://auth.ebay.com",
      }
    : {
        api: "https://api.sandbox.ebay.com",
        auth: "https://auth.sandbox.ebay.com",
      };
