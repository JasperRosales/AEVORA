# Getting Started

Aevora is a cemetery management system with two faces:

- **Staff dashboard** — a desktop web app for admins and staff (overview, map, plots, reservations, clients, payments, agreements, reports).
- **Client portal** — a mobile-first web app for families with a reservation (home, reservations, payments, profile).

Both live in one React SPA; the signed-in user's **role** decides which one loads.

## Tech stack

| Layer     | Technology                                                             |
| --------- | ---------------------------------------------------------------------- |
| Frontend  | React 19 + TypeScript + Vite + Tailwind CSS v4 (custom `navy`/`cream`/`teal` palette) |
| Backend   | Hono API deployed as a **Neon Function** (`api/index.ts`)               |
| Database  | Neon (Lakebase Postgres), accessed via `pg` and Drizzle schema          |
| Storage   | Neon Object Storage (S3-compatible, `assets` bucket) for attachments   |
| Auth      | Neon Auth (Managed Better Auth) — JWTs verified server-side via JWKS    |

## Prerequisites

- Node.js 20+
- A Neon account/project with the AEVORA services declared in `neon.ts` (auth, the `api` function, and the `assets` bucket)

## Environment variables

The frontend reads `VITE_*` variables, the API function reads the rest. They are typically synced into `.env.local` by the Neon CLI:

| Variable                     | Used by      | Purpose                                        |
| ---------------------------- | ------------ | ---------------------------------------------- |
| `VITE_NEON_API_URL`          | SPA          | Base URL of the deployed API function          |
| `VITE_NEON_API_KEY`          | SPA          | Ops fallback key (also used by scripts/tests)  |
| `VITE_NEON_AUTH_URL`         | SPA          | Neon Auth base URL for the login client        |
| `DATABASE_URL`               | API + seed   | Postgres connection (pooled)                   |
| `DATABASE_URL_UNPOOLED`      | API + seed   | Direct Postgres connection                     |
| `API_KEY`                    | API function | Shared secret checked on every data route      |
| `NEON_AUTH_BASE_URL`         | API function | Auth server (sign-up, issuer)                  |
| `NEON_AUTH_JWKS_URL`         | API function | JWT verification key set                       |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_ENDPOINT_URL_S3` / `AWS_REGION` | API function | Neon Object Storage access |
| `NEON_BRANCH`                | API function | Branch name (surfaced by `/health`)            |

If `VITE_NEON_API_URL` or `VITE_NEON_AUTH_URL` are missing, the app degrades gracefully: the data store stays empty and the login screen reports that auth is not configured.

## Commands

```bash
npm install        # install dependencies
npm run dev        # start the Vite dev server (default http://localhost:5173)
npm run build      # typecheck (tsc -b) and build for production
npm run preview    # serve the production build locally
npm run lint       # ESLint
npm run format     # Prettier (writes TS/TSX files)
npm run typecheck  # tsc --noEmit
```

## Seeding the database

The app itself never writes business records — the database is loaded once by the seed script:

```bash
npx tsx api/db/seed.ts
```

This creates the schema (Drizzle, `api/db/schema.ts`) in the linked Neon branch and inserts the starter dataset from `api/db/seed-data/` (cemeteries, plots, reservations, clients, payments, agreements, activities, notifications, reports).

## Signing in

The site has two entry points:

- **Staff/admin:** **`/login`** (e.g. `https://aevora-iota.vercel.app/login`) —
  the login screen (`src/features/auth/admin-login-page.tsx`) accepts staff and
  admin accounts. Accounts are created by an admin (see
  [Staff Accounts](staff-accounts.md)).
- **Client:** the client portal at **`/client/login`** (e.g.
  `https://aevora-iota.vercel.app/client/login`) — a client-role account whose
  email matches a row in the `clients` table. Portal accounts are provisioned
  automatically when staff add a client (a one-time password is shown in the
  Add Client modal), and the portal then shows only that family's records.

A role that signs in on the wrong endpoint is signed out and shown an error
saying which URL to use (`vercel.json` rewrites `/login` and `/client/*` to the
SPA).

## Architecture at a glance

```
src/                     React SPA
├── App.tsx              Session bootstrap + role routing (staff dashboard vs client portal)
├── features/
│   ├── lazy-routes.ts   Route-level code splitting per sidebar page
│   ├── auth/            Login screen
│   ├── overview/ … map/ plots/ reservations/ clients/ payments/ agreements/ reports/
│   ├── client/          Mobile client portal (tabs)
│   └── staff/           Hidden staff-account admin page
├── data/                Tiny external stores (useSyncExternalStore) + session
└── lib/                 API clients, auth token handling, formatting, status colors

api/                     Hono API (Neon Function, deployed next to the DB)
├── index.ts             App + /health + route mounting
├── routes/              staff-data, accounts, client portal, attachments
├── lib/                 JWT auth guards, pg pool, Object Storage helpers
└── db/                  Drizzle schema + seed script/data
```

Key behaviours:

- **Role routing** (`src/App.tsx`): `client` role → mobile portal; everyone else → staff dashboard. The staff dashboard's "all records" fetch only runs for staff/admin.
- **Server-side scoping**: the client portal endpoints (`api/routes/client-routes.ts`) match the caller's auth email to their `clients` row — the UI never decides what a client may see.
- **Route code splitting** (`src/features/lazy-routes.ts`): each sidebar page is a separate lazy chunk, warmed on sidebar hover/focus. The shell passes `onNavigate`/`onPrefetch` down to each screen (`DashboardProps`) so in-page shortcuts — like the Overview quick actions — can switch pages and warm the target chunk.
- **Auth**: every API call carries a short-lived Neon Auth JWT (15 min, cached in `src/lib/auth.ts`) or the ops `API_KEY`.
- **Writes**: staff create records through `staffGuard`-protected POST routes in `api/routes/staff-data-routes.ts` (`/clients`, `/plots`, `/reservations`, `/payments`, `/reports`), reachable from the Overview quick actions.

Continue to the [Table of Contents](README.md) to read the per-page guides.

## Deploying backend changes

The API function is deployed separately from the SPA. After changing anything
under `api/`, apply it to the branch with the Neon CLI:

```bash
neon deploy --project-id <project-id>   # or: neon deploy (from a linked dir)
```

The SPA can be built/deployed independently (`npm run build`); the quick-action
forms call the same `VITE_NEON_API_URL` the rest of the dashboard uses.
