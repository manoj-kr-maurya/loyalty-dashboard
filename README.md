# JAS Loyalty — Tenant Dashboard

Frontend dashboard for a single loyalty tenant (organization) to manage their program. Built with **React + Vite + TypeScript + Tailwind CSS**. This is a **separate repo** from the NestJS backend (`jas-loyalty-engine-micro`).

## Screens

- **Login** — OTP-based org login (`/organization/otp/phone` → `/organization/otp/validate`)
- **Overview** — KPI cards, currency bucket breakdown, distributed points
- **Analytics** — aggregate points/campaign/promo/customer stats with CSV export
- **Currencies** — list/create currencies, add buckets, configure auto top-up
- **Campaigns** — list/create/update campaigns, potential-earning calculator
- **Promo Codes** — create promos and generate/claim coupon codes
- **Coupon Tools** — generate/allocate/claim/validate/list and block/release codes
- **Tiers** — define loyalty tiers (levels, point thresholds, multipliers, colors)
- **Rewards** — earn/burn/estimate/expire points, statements, ledger, tier status
- **Customers** — top customers, plus per-customer profile, wallets and orders
- **Shops** — edit shop profile fields (address, hours, UPI, contact, about)
- **Orders** — organization and customer orders with status updates
- **Engines** — console for FX, PLB, value-exchange, promo and points engines
- **Webhooks** — manage endpoints, deliver, retry, dead letters, rotate secrets
- **Settings** — edit organization profile and manage organization API keys

## Setup

```bash
cp .env.example .env
# set VITE_API_KEY to an organization-scoped (tenant) API key
npm install
npm run dev   # http://localhost:5173
```

`.env`:

```
VITE_API_BASE_URL=http://localhost:3003
VITE_API_KEY=loy_<prefix>_<secret>
```

`VITE_API_KEY` must be an **organization-scoped** key. Do **not** use the platform
`ADMIN_API_KEY`: it grants cross-tenant access and is rejected by tenant-scoped UI
flows. The key is bound to one organization, and the backend enforces that every
request only touches that tenant.

## Point it at a backend

Set `VITE_API_BASE_URL` in `.env` (defaults to `http://localhost:3003`). API calls
are sent directly to this base URL with `x-api-key: $VITE_API_KEY`.

## Layout

```
src/
  lib/          api client, auth storage, types, hooks, endpoint/action helpers
                (endpoints, integrations, engines, customers, orders)
  layouts/      DashboardLayout (sidebar + header, auth-protected)
  pages/        Login, Dashboard, Analytics, Currencies, Campaigns, PromoCodes,
                CouponTools, Tiers, Rewards, Customers, CustomerDetail, Shops,
                Orders, Engines, Webhooks, Settings
```

## Commands

- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npm run preview` — preview the production build
- `npm test` — run the Vitest suite
**. Never make a change silently — always link the fix/feature to a concept and give a resource.

## 🎓 Learning Requirement

When fixing, implementing, or changing anything, the AI assistant MUST include three sections:
1. **Concept** — the underlying idea/principle.
2. **Implementation Principle / Pattern applied** — name the SOLID principle, GoF design pattern, or architecture pattern used, and where in the code (file:line).
3. **Resource** — official docs/article for learning.

Every change is a learning opportunity; never change silently.

