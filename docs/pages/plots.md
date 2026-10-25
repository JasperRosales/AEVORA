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
- New plots are added from the **Add Plot** quick action on the
  [Overview](overview.md) page (`POST /plots`). The plot id and number are
  derived from cemetery + section + row + column (e.g. `A-101`), and duplicates
  are rejected with a 409.
- **Bulk layout:** the [Cemetery Map](cemetery-map.md) page's **Build Plot
  Grid** action creates a rectangular block of plots for a cemetery — multiple
  sections, a rows × columns block, a starting cell, and a shared
  type/size/price (`POST /plots/grid`). Existing cells are skipped, so grids can
  be extended safely.
- Plot status colors are shared with the map and badges via
  `src/lib/status.ts`, so the same status always looks the same across the app.
- The mobile [client portal](client-portal.md) offers every `Available` plot in
  this register as a buying catalogue and draws the same section grid on its
  map; a reservation made there flips the plot to `Reserved` exactly like a
  staff booking.

## Related

- [Cemetery Map](cemetery-map.md) — the spatial view of the same records.
- [Reservations](reservations.md) — reservations reference plots by number.
