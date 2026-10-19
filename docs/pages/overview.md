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
4. **Quick Actions** (`overview-quick-actions.tsx`) — shortcut tiles (Add
   Client, Add Plot, View Cemetery Map, Create Reservation, Review Information
   Checking, View Agreements, Record Payment, Generate Report) plus a row of
   report shortcuts (Plot Occupancy, Reservations, Clients, Payments,
   Agreements, Information Checking).
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

## Related

- [Cemetery Map](cemetery-map.md) — the interactive view of the same plot data.
- [Reports](reports.md) — the chart-heavy analytics view.
