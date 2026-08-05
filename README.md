# JAS Loyalty — Org Admin UI

Frontend dashboard for organization admins to manage their loyalty program. Built with **React + Vite + TypeScript + Tailwind CSS**. This is a **separate repo** from the NestJS backend (`jas-loyalty-engine-micro`).

## Screens

- **Login** — OTP-based org login (`/organization/otp/phone` → `/organization/otp/validate`)
- **Overview** — KPI cards, currency bucket breakdown, distributed points
- **Currencies** — list buckets, create a currency, top-up bucket balance
- **Campaigns** — list/create campaigns (earning %, currency, date range)
- **Customers** — list + search customers

## Setup

```bash
npm install
npm run dev   # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the NestJS backend at `http://localhost:3003` (rewrites `/api` → ``).

## Point it at a backend

Edit the proxy target in `vite.config.ts`:

```ts
proxy: {
  '/api': {
    target: 'http://localhost:3003',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
},
```

## Layout

```
src/
  lib/          api client, auth storage, types, data hooks, endpoint/action helpers
  layouts/      DashboardLayout (sidebar + header, auth-protected)
  pages/        Login, Dashboard, Currencies, Campaigns, Customers
```

## Commands

- `npm run dev` — dev server
- `npm run build` — type-check + production build
- `npm run preview` — preview the production build