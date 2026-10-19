# Plots

**Sidebar entry:** Plots
**Source:** `src/features/plots/plots-page.tsx`

The plot register: a searchable, filterable, paginated table of every plot
across all cemeteries.

## Page structure

### KPI strip

Total Plots, Available, Reserved, and Occupied (counts over the whole dataset,
not the filtered subset).

### Plot Records table

Filter row:

- **Search** — matches plot number or section (case-insensitive).
- **Status** — All / Available / Reserved / Occupied / Waiting for Checking /
  Unavailable.
- **Type** — All / Private / Vertical / Public.
- **Cemetery** — All / each cemetery by name.
- **Clear Filters** — resets all four controls.

Columns: Plot Number, Cemetery, Section, Type, Size, Price (formatted as ₱ via
`formatCurrency`), Status (colored `StatusBadge`), and Edit/Delete row actions.

The table paginates 12 rows per page (`usePagination`, `Pagination` component).

## Notes

- The Edit/Delete buttons are presentational in the current build (records are
  seeded/managed in the database; see `api/db/seed.ts`).
- Plot status colors are shared with the map and badges via
  `src/lib/status.ts`, so the same status always looks the same across the app.

## Related

- [Cemetery Map](cemetery-map.md) — the spatial view of the same records.
- [Reservations](reservations.md) — reservations reference plots by number.
