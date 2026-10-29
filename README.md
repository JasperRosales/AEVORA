# Aevora — Cemetery Management System

Aevora is a full-stack cemetery management app built on Neon:

- **Staff dashboard** (desktop) — Overview, Cemetery Map, Reservations, Clients,
  Payments, Agreements, and Reports.
- **Client portal** (mobile-first) — families browse the plot map (or a list of
  available plots), reserve one, pay (or upload proof), and follow their
  reservations and documents.

The frontend is a React 19 + TypeScript + Vite SPA styled with Tailwind CSS v4.
The backend is a Hono API deployed as a **Neon Function** next to a Lakebase
Postgres branch, with Neon Auth for sign-in and Neon Object Storage for
reservation documents.

Dashboard quick actions have full functionality: Add Client, Add Plot, Create
Reservation, Record Payment, and Generate Report POST to the API function, while
View Cemetery Map, Review Information Checking, and View Agreements navigate to
the matching screen. On the Overview page, the Recent Reservations **View** and
Information Checking **Review** buttons open a reservation dialog where staff can
read the record or update its verification result. The Cemetery Map also has a
**Build Plot Grid** builder for laying out a whole block of plots (multiple
sections, rows × columns, start cell, shared type/size/price).

The header notification centre is database-backed: opening it re-reads the
`notifications` table, and mark read/unread, mark all read, and delete persist
through the API function so the header badge and Overview feed stay in sync.

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

The Neon CLI syncs service credentials into `.env.local`. The frontend reads
`VITE_NEON_API_URL`, `VITE_NEON_API_KEY`, and `VITE_NEON_AUTH_URL`; the API
function reads `DATABASE_URL`, `API_KEY`, `NEON_AUTH_*`, and `AWS_*`. See
[docs/getting-started.md](docs/getting-started.md) for the full table.

### 3. Seed the database (first run only)

```bash
npx tsx api/db/seed.ts
```

### 4. Run

```bash
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run preview    # serve the production build
npm run lint       # ESLint
npm run format     # Prettier
npm run typecheck  # tsc --noEmit
```

Sign in with a staff/admin account for the dashboard, or a client account for
the mobile portal. Admins can create accounts on the hidden `#/staff-accounts`
page.

## Table of contents

Full documentation lives in [`docs/`](docs/README.md).

### Guides

- [Getting Started](docs/getting-started.md) — tech stack, environment
  variables, commands, seeding, and architecture overview

### Staff Dashboard pages

- [Login](docs/pages/login.md) — sign-in screen and role-based routing
- [Overview](docs/pages/overview.md) — dashboard home: KPIs, occupancy,
  working quick actions, summaries, and feeds
- [Cemetery Map](docs/pages/cemetery-map.md) — site-plan plot map with filters,
  a configurable parcel layout, status editing, a details panel, and a bulk grid
  builder
- [Reservations](docs/pages/reservations.md) — reservation tracking and
  document attachments
- [Clients](docs/pages/clients.md) — client register and the client/account
  link
- [Payments](docs/pages/payments.md) — payment ledger with totals by status
- [Agreements](docs/pages/agreements.md) — agreement registry
  (reservation agreements, deeds of sale, maintenance)
- [Reports](docs/pages/reports.md) — revenue charts, status breakdowns, and
  the generated-report log

### Client Portal

- [Client Portal](docs/pages/client-portal.md) — the mobile-first app: Home,
  Plots (map + list with reservation), Reservations (with document
  upload/download), Payments, and Profile

### Administration

- [Staff Accounts](docs/pages/staff-accounts.md) — hidden admin page at
  `#/staff-accounts` for creating/deleting staff, admin, and client accounts

## Project layout

```
src/                     React SPA
├── App.tsx              Session bootstrap + role routing
├── features/            One folder per page/portal (lazy-loaded routes)
├── data/                External stores (useSyncExternalStore) + session
└── lib/                 API clients, auth tokens, formatting, status colors

api/                     Hono API (Neon Function)
├── index.ts             App + /health + route mounting
├── routes/              staff-data, accounts, client portal, attachments
├── lib/                 JWT guards, pg pool, Object Storage helpers
└── db/                  Drizzle schema, seed script, and seed data
```
