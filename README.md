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

### eBay credentials

The backend reads eBay credentials from `packages/backend/.env` (already created locally from
`packages/backend/.env.example`, gitignored — never commit it). It's pre-filled with the
sandbox keyset, **except `EBAY_RU_NAME`**, which you still need to fill in:

1. In the [eBay Developer Program](https://developer.ebay.com/my/keys), open your sandbox
   keyset → **User Tokens** → **"Get a Token from eBay via Your Application"**.
2. Add `http://localhost:4000/api/ebay/auth/callback` as an accepted redirect URL and copy the
   generated **RuName** into `EBAY_RU_NAME` in `packages/backend/.env`.

> Note: double-check `EBAY_CLIENT_SECRET` (Cert ID) in the .env against the Developer Portal —
> the value provided during setup looked shorter than eBay's usual Cert ID format, so it's worth
> confirming before relying on it.

### Run

```bash
npm run dev
```

This starts the backend on `http://localhost:4000` and the frontend on `http://localhost:5173`
(the frontend proxies `/api` to the backend, see `packages/frontend/vite.config.ts`).

Open `http://localhost:5173`, click **Connect to eBay**, log in with a sandbox test user, and
you'll be redirected back once the OAuth tokens are stored.

## Roadmap

- [x] eBay OAuth (authorization code + refresh) against the sandbox
- [x] List inventory items (Inventory API)
- [x] Bulk price/quantity update (Inventory API's bulk endpoint)
- [ ] Auto-relist rules: detect sold-out fixed-quantity listings and recreate them via the
      Inventory API, on a schedule — needs a rules table, which is the likely trigger for adding
      MySQL
- [ ] Persistent storage (MySQL) for OAuth tokens, relist rules, and job history
- [ ] Multi-account / multi-user support
