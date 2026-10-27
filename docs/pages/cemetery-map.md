# Cemetery Map

**Sidebar entry:** Cemetery Map
**Source:** `src/features/map/cemetery-map-page.tsx` (+ `plot-land-map.tsx`, `plot-map-canvas.tsx`, `plot-grid-builder.tsx`, `plot-list-view.tsx`, `plot-details-panel.tsx`)

An interactive, visual view of every plot in a cemetery. Staff use it to find
an open plot at a glance, check what surrounds it, jump to its details, and lay
out new plots as a grid.

## Page structure

### KPI strip

Five tiles computed for the selected cemetery: Available Plots, Reserved
Plots, Occupied Plots, Plots Pending Verification, and Total Revenue (sum of
prices of Occupied + Reserved plots).

### Filter bar

| Control         | Options                                                    |
| --------------- | ---------------------------------------------------------- |
| Cemetery        | every cemetery (defaults to the first one once data loads) |
| Burial type     | All / Private / Vertical / Public                          |
| Section         | All / every section present in the selected cemetery       |
| Status          | All / every `PlotStatus` value                             |
| Search          | free-text plot number                                      |
| Clear Filters   | resets everything                                          |
| Locate          | selects the plot whose number matches the search box       |
| Build Plot Grid | opens the bulk grid builder (see below)                    |
| Map / List      | toggles between the two views                              |

A caption below the bar shows the active cemetery, its location, and how many
plots match the current filters.

### Map view (`PlotMapCard`)

- A **site-plan drawing** (`PlotLandMap`), not a table of cards: a land boundary
  contains one parcel per section, and each parcel contains its plots. Section
  parcels keep the proportions of their plot grid, so a 4 × 8 block reads as a
  wide rectangle, a 6 × 6 block as a square, and a 10 × 10 block as a large
  square. A section created with the grid builder appears automatically — no
  hardcoded A–D list.
- The **Layout** control above the map chooses how many section parcels to place
  per row (1–4). Rows follow automatically, and the caption reads the result,
  e.g. `2 col × 3 rows` for six sections. The drawing scales to fill the card.
- Each plot cell is colored by status (see `plotStatusFill` in
  `src/lib/status.ts`: green = Available, blue = Reserved, red = Occupied,
  yellow = Waiting for Checking, grey = Unavailable). A plot's position comes
  from its `row` and `column` fields.
- Plot numbers are printed on cells when the section grid is small enough to
  stay readable; otherwise the tooltip carries the number and status.
- Plots that don't match the active filters dim to 18% opacity rather than
  disappearing, keeping the spatial context.
- Clicking a cell selects it; clicking the land background clears the selection.
  Hovering a cell shows a tooltip with the plot number and status.
- The **status palette** above the map applies a status to the selected plot
  immediately (`PATCH /plots/:id`). Choosing **Available** also clears
  `reserved_for`, so a freed plot can be reserved again. The store is updated in
  place, so the map, KPIs and list reflect the change without a reload.
- The **Add plots** button in the map header opens the grid builder with the
  next unused section letter prefilled. Rows × columns in the builder sets the
  new parcel's shape on the drawing.
- A compact legend below the drawing repeats the status colors for quick
  reading.
- With no plots in the cemetery, the card shows an empty state with a **Build
  plot grid** shortcut.

### Plot grid builder (`PlotGridBuilderModal`)

A bulk alternative to the single **Add Plot** quick action. The admin describes
a rectangular block and previews it before creating anything:

- **Cemetery**, **Sections** (comma-separated, e.g. `A, B, C`), **Rows**,
  **Columns**, **Start row** and **Start column**.
- Rows × columns also sets the parcel's shape on the site plan: 3 × 3 is a
  square, 4 × 8 a wide rectangle, and 10 × 10 a large square.
- Shared **type**, **status**, **size** and **price** for every generated plot.
- The plot number and id use the same scheme as the single Add Plot action
  (`A-101`, id `<cemetery>-A-1-1`), so a grid extension lines up with existing
  records.
- The live preview colors new cells teal and cells that already exist grey, and
  reports how many will be created vs. skipped.
- Cells that already exist are skipped (`onConflictDoNothing`), so re-running a
  block or extending a section is safe. A request is capped at 500 plots.
- On success the new rows are appended to the staff store, so the map, KPIs and
  plot register update immediately; a dismissible banner reports the count.

### Details panel (`PlotDetailsCard`)

Shown next to the map (left column). When a plot is selected it displays its
number, section, type, size, price, and status; otherwise it prompts the user
to click a plot. If a reservation exists for the plot, the panel also shows its
number and information-checking badge, and the action buttons become live:

- **Reserve Plot** (Available) opens the create-reservation form with the plot
  and cemetery prefilled.
- **View Reservation** (Reserved/Occupied) opens the reservation record dialog.
- **Review Request** (Waiting for Checking, or any reservation not yet
  `Verified`) opens the same dialog in information-checking mode, where staff
  can set the reservation status and verification result.
- **View Details** always opens the plot edit dialog for type, size, price,
  status, and reserved-for changes.

The reservation dialog is shared with the Overview page
(`src/features/shared/reservation-review-modal.tsx`). Saving calls
`PATCH /reservations/:id`, mirrors the updated row into the store, and refreshes
the map, details panel, and Overview tables without a reload.

### List view (`PlotListView`)

The same filtered plots as a scrollable table (plot number, section, type,
size, price, status) for people who prefer rows over the map.

## Data

Plots and cemeteries come from the shared staff store (`/plots`, `/cemeteries`
endpoints, staff-guarded). The grid builder posts to `POST /plots/grid`
(staff-guarded) and receives `{ created, skipped }`.

The mobile [client portal](client-portal.md) reads the same plots through
`GET /client/plots?scope=all` and renders the same section grid, so an admin
layout is immediately visible to families. The same endpoint without `scope=all`
still returns Available plots only, which is what the portal's list view uses.
