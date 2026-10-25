# Cemetery Map

**Sidebar entry:** Cemetery Map
**Source:** `src/features/map/cemetery-map-page.tsx` (+ `plot-map-canvas.tsx`, `plot-grid-builder.tsx`, `plot-list-view.tsx`, `plot-details-panel.tsx`)

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

- An SVG canvas whose **sections and dimensions come from the plots
  themselves**: every distinct `section` in the cemetery is drawn, sized to the
  highest `row` and `column` in that cemetery. A section created with the grid
  builder appears automatically — no hardcoded A–D list.
- Each cell is colored by status (see `plotStatusFill` in
  `src/lib/status.ts`: green = Available, blue = Reserved, red = Occupied,
  yellow = Waiting for Checking, grey = Unavailable).
- Column numbers run across the top of each section so large grids stay
  readable. A plot's position comes from its `row` and `column` fields.
- Plots that don't match the active filters dim to 15% opacity rather than
  disappearing, keeping the spatial context.
- **Zoom in / out / reset** controls scale the canvas (0.5×–3×).
- Hovering a cell shows a tooltip with the plot number and status; clicking
  selects the plot.
- A legend at the bottom maps colors to statuses.
- With no plots in the cemetery, the card shows an empty state with a **Build
  plot grid** shortcut.

### Plot grid builder (`PlotGridBuilderModal`)

A bulk alternative to the single **Add Plot** quick action. The admin describes
a rectangular block and previews it before creating anything:

- **Cemetery**, **Sections** (comma-separated, e.g. `A, B, C`), **Rows**,
  **Columns**, **Start row** and **Start column**.
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
to click a plot.

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
