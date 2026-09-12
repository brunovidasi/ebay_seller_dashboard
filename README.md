# eBay Seller Dashboard

A self-hosted dashboard for eBay sellers who need to manage listings faster and in bulk —
things the official Seller Hub either buries in click-heavy flows or doesn't support at all
(like automatically relisting an item that sold out instead of just letting it end).

Built as a TypeScript case study: a Node.js/Express API talking to the eBay REST APIs, and a
small React frontend, organized so new pages and features are cheap to add as the project grows.

## Why

- **Bulk editing**: change price/quantity across many SKUs at once instead of one listing at a
  time in the eBay UI.
- **Workarounds for Seller Hub limitations**: e.g. auto-relisting a sold-out fixed-quantity
  listing, which eBay's own dashboard won't do for you.

## Stack

- TypeScript everywhere
- Backend: Node.js, Express, eBay REST APIs (Inventory API, OAuth)
- Frontend: React + Vite, plain CSS (no UI framework yet — functionality first)
- Database: none yet. MySQL is the plan once persistence is actually needed (e.g. relist rules,
  multi-user auth); until then OAuth tokens are cached in a local JSON file (see below).

## Project layout

```
packages/
  shared/    Types shared between backend and frontend (InventoryItem, API payloads, ...)
  backend/   Express API that talks to eBay on the server's behalf
  frontend/  React app (Dashboard, Products/bulk-edit, ...)
```

Each package is an npm workspace, so adding a new page is "add a file under
`packages/frontend/src/pages`", and adding a new API area is "add a router under
`packages/backend/src/routes`" — no cross-cutting wiring required.

## Setup

Requires Node 20+.

```bash
npm install
```

### Marketplace

Defaults to `EBAY_AU` / `AUD` (`EBAY_MARKETPLACE_ID` / `EBAY_CURRENCY` in `.env`), since this is
being built for the Australian eBay site. Change those two values to target a different
marketplace — they control the `X-EBAY-C-MARKETPLACE-ID` header sent on every Inventory API call
and the currency used for price updates.

### eBay credentials

The backend reads eBay credentials from `packages/backend/.env` (already created locally from
`packages/backend/.env.example`, gitignored — never commit it). It's pre-filled with the
sandbox keyset and `EBAY_RU_NAME`.

If you need to regenerate the RuName: in the [eBay Developer Program](https://developer.ebay.com/my/keys),
open your sandbox keyset → **User Tokens** → **"Get a Token from eBay via Your Application"**,
add `https://localhost:4000/api/ebay/auth/callback` as the accepted redirect URL (eBay forces
`https://` here — see note below), select the **OAuth (new security)** option (not the legacy
Auth'n'Auth flow), and copy the generated **RuName** into `EBAY_RU_NAME`.

### Local HTTPS

eBay requires the redirect URL to be `https://`, but there's no real domain/cert for
`localhost`. `npm run dev` auto-generates a self-signed TLS cert (`packages/backend/certs/`,
gitignored — see `packages/backend/scripts/gen-cert.sh`) and the backend serves HTTPS on
`https://localhost:4000` using it. This is dev-only: the cert isn't added to any system trust
store, so your browser will show a "connection is not private" warning the first time it hits
`https://localhost:4000` directly (during the OAuth callback) — click through it
(Advanced → Proceed), it's expected for a self-signed local cert.

### Run

```bash
npm run dev
```

This starts the backend on `https://localhost:4000` and the frontend on `http://localhost:5173`
(the frontend dev server proxies `/api` to the backend over HTTPS, see
`packages/frontend/vite.config.ts`).

Open `http://localhost:5173`, click **Connect to eBay**, log in with a sandbox test user, accept
the one-time browser security warning when eBay redirects back to
`https://localhost:4000/api/ebay/auth/callback`, and you'll land back on the dashboard once the
OAuth tokens are stored.

## Roadmap

- [x] eBay OAuth (authorization code + refresh) against the sandbox
- [x] List inventory items (Inventory API)
- [x] Bulk price/quantity update (Inventory API's bulk endpoint)
- [ ] Auto-relist rules: detect sold-out fixed-quantity listings and recreate them via the
      Inventory API, on a schedule — needs a rules table, which is the likely trigger for adding
      MySQL
- [ ] Persistent storage (MySQL) for OAuth tokens, relist rules, and job history
- [ ] Multi-account / multi-user support
