import { useEffect, useState } from "react";
import type { EbayAuthStatus } from "shared";
import { api } from "../api/client";

export default function Dashboard() {
  const [status, setStatus] = useState<EbayAuthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAuthStatus()
      .then(setStatus)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <section>
      <h2>Connection</h2>
      {error && <p className="error">{error}</p>}
      {!error && !status && <p>Checking connection status…</p>}
      {status && status.connected && (
        <p>
          Connected to eBay. Access token valid until{" "}
          <strong>{new Date(status.expiresAt ?? "").toLocaleString()}</strong>.
        </p>
      )}
      {status && !status.connected && (
        <div>
          <p>Not connected to your eBay (sandbox) account yet.</p>
          <a className="button" href="/api/ebay/auth/login">
            Connect to eBay
          </a>
        </div>
      )}
    </section>
  );
}
