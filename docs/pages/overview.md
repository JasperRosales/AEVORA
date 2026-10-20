# Overview (Dashboard Home)

**Sidebar entry:** Overview
**Source:** `src/features/overview/overview-page.tsx` + `overview-*` sibling modules

The Overview page is the staff dashboard's landing page: a single screen that
answers "how is the cemetery doing right now?". It is a composition of section
cards, each living in its own module under `src/features/overview/`.

## Layout

1. **Welcome header card** — greeting, current date, and a **cemetery selector**
   (`CemeterySelector`, `src/components/cemetery-selector.tsx`). The selected
   cemetery scopes the KPIs and the occupancy card; "All Cemeteries" is the
   default.
2. **KPI strip** (`overview-kpis.tsx`) — Total Plots, Available, Reserved,
   Occupied, Waiting for Checking, computed from the filtered plots.
3. **Plot Occupancy Overview** (`overview-occupancy.tsx`) — donut chart of the
   plot-status breakdown with the occupancy rate (Occupied + Reserved as a % of
   total) in the center and a progress bar underneath.
4. **Quick Actions** (`overview-quick-actions.tsx`) — shortcut tiles. Each one
   is live: **Add Client**, **Add Plot**, **Create Reservation**,
   **Record Payment**, and **Generate Report** open a form modal
   (`overview-action-modals.tsx`) that POSTs to the API and reports the new
   record back on the card header; **View Cemetery Map**, **Review Information
   Checking**, and **View Agreements** navigate to the matching screen. The
   report tiles (Plot Occupancy, Reservations, Clients, Payments, Agreements,
   Information Checking) generate a report record and open the Reports log.
5. **Recent Reservations** (`overview-record-tables.tsx`) — the five most
   recent reservations with client, cemetery, plot, date, and status badge.
6. **Pending Checks** (`overview-record-tables.tsx`) — reservations whose
   verification status is not yet "Verified".
7. **Payment Summary** (`overview-summary-cards.tsx`) — amount collected (Paid
   payments), a stacked Paid/Pending/Overdue bar, and remaining balance.
8. **Agreement Summary** (`overview-summary-cards.tsx`) — active vs total
   agreements with a status breakdown.
9. **System Notifications** (`overview-info-cards.tsx`) — the notifications feed.
10. **Recent Activity** (`overview-info-cards.tsx`) — audit-style feed (action,
    user, timestamp, related record).
11. **Reports shortcut card** (`overview-quick-actions.tsx`).

## Data

All data comes from the shared staff store (`src/data/store.ts`), loaded once
per sign-in via `fetchAll()` (nine parallel GETs against the API function).
If the backend is unreachable the cards render empty — there is no local
fallback.

## Quick-action writes

The five form actions POST to the staff-data routes (`api/routes/staff-data-routes.ts`):
`POST /clients`, `POST /plots`, `POST /reservations`, `POST /payments`, and
`POST /reports` — all behind `staffGuard`. Creating a reservation also books
the plot (`Reserved`) and bumps the client's reservation count server-side, and
the response carries all three updated rows. The client mirrors those rows into
the store so the dashboard updates without a reload; the next `fetchAll()`
returns the same state from Postgres.

## Related

- [Cemetery Map](cemetery-map.md) — the interactive view of the same plot data.
- [Reports](reports.md) — the chart-heavy analytics view.
