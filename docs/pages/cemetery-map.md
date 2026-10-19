# Cemetery Map

**Sidebar entry:** Cemetery Map
**Source:** `src/features/map/cemetery-map-page.tsx` (+ `plot-map-canvas.tsx`, `plot-list-view.tsx`, `plot-details-panel.tsx`)

An interactive, visual view of every plot in a cemetery. Staff use it to find
an open plot at a glance, check what surrounds it, and jump to its details.

## Page structure

### KPI strip

Five tiles computed for the selected cemetery: Available Plots, Reserved
Plots, Occupied Plots, Plots Pending Verification, and Total Revenue (sum of
prices of Occupied + Reserved plots).

### Filter bar

| Control        | Options                                                    |
| -------------- | ---------------------------------------------------------- |
| Cemetery       | every cemetery (defaults to the first one once data loads) |
| Burial type    | All / Private / Vertical / Public                          |
| Section        | All / Sections A–D                                         |
| Status         | All / every `PlotStatus` value                             |
| Search         | free-text plot number                                      |
| Clear Filters  | resets everything                                          |
| Locate         | selects the plot whose number matches the search box       |
| Map / List     | toggles between the two views                              |

A caption below the bar shows the active cemetery, its location, and how many
plots match the current filters.

### Map view (`PlotMapCard`)

- An SVG canvas rendering four **sections (A–D)**, each a 6×4 grid of cells
  (16 px cells with 4 px gaps). A plot's position on the grid comes from its
  `row` and `column` fields.
- Each cell is colored by status (see `plotStatusFill` in
  `src/lib/status.ts`: green = Available, blue = Reserved, red = Occupied,
  yellow = Waiting for Checking, grey = Unavailable).
- Plots that don't match the active filters dim to 15% opacity rather than
  disappearing, keeping the spatial context.
- **Zoom in / out / reset** controls scale the canvas (0.5×–3×).
- Hovering a cell shows a tooltip with the plot number and status; clicking
  selects the plot.
- A legend at the bottom maps colors to statuses.

### Details panel (`PlotDetailsCard`)

Shown next to the map (left column). When a plot is selected it displays its
number, section, type, size, price, and status; otherwise it prompts the user
to click a plot.

### List view (`PlotListView`)

The same filtered plots as a scrollable table (plot number, section, type,
size, price, status) for people who prefer rows over the map.

## Data

Plots and cemeteries come from the shared staff store (`/plots`, `/cemeteries`
endpoints, staff-guarded).
