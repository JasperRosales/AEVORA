import { LayoutGrid } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Modal } from "@/components/ui/modal"
import { updatePlotRows } from "@/data/store"
import { PLOT_CATEGORIES } from "@/lib/plot-category"
import { groupPlots, type PlotPlacement } from "@/lib/neon-api"
import type { Plot, PlotCategory } from "@/types/domain"

const LABEL = "mb-1 block text-xs font-medium text-deep"
const INPUT =
  "w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
const PRIMARY =
  "rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
const GHOST = "neu-button px-4 py-2 text-sm"

type LayoutMode = "row" | "column" | "grid"

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function toInt(value: string): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : 0
}

function nearSquare(count: number) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)))
  return { columns, rows: Math.ceil(count / columns) }
}

/**
 * Groups the plots selected on the map and lays them out as a single row, a
 * single column, or a rows × columns grid. The chosen row/column values are
 * saved on each plot so the map draws the group as that block.
 */
export function PlotGridGroupModal({
  plots,
  onClose,
  onGrouped,
}: {
  plots: Plot[]
  onClose: () => void
  onGrouped: (message: string) => void
}) {
  const [groupName, setGroupName] = useState(plots[0]?.groupName ?? "")
  const [category, setCategory] = useState<PlotCategory>(
    plots[0]?.type ?? "Typical Block"
  )
  const [mode, setMode] = useState<LayoutMode>("grid")
  const [rows, setRows] = useState(String(nearSquare(plots.length).rows))
  const [columns, setColumns] = useState(
    String(nearSquare(plots.length).columns)
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rowCount = toInt(rows)
  const columnCount = toInt(columns)
  const capacity = rowCount * columnCount
  const fits = rowCount >= 1 && columnCount >= 1 && capacity >= plots.length
  const ordered = plots
    .slice()
    .sort((a, b) => a.row - b.row || a.column - b.column)

  function chooseMode(next: LayoutMode) {
    setMode(next)
    if (next === "row") {
      setRows("1")
      setColumns(String(plots.length))
    } else if (next === "column") {
      setRows(String(plots.length))
      setColumns("1")
    } else {
      const square = nearSquare(plots.length)
      setRows(String(square.rows))
      setColumns(String(square.columns))
    }
  }

  async function saveGroup(event: FormEvent) {
    event.preventDefault()
    if (!groupName.trim() || !fits || busy) return
    setBusy(true)
    setError(null)
    try {
      const baseRow = Math.min(...ordered.map((plot) => plot.row))
      const baseColumn = Math.min(...ordered.map((plot) => plot.column))
      const placements: PlotPlacement[] = ordered.map((plot, index) => ({
        id: plot.id,
        row: baseRow + Math.floor(index / columnCount),
        column: baseColumn + (index % columnCount),
      }))
      const updated = await groupPlots(
        ordered.map((plot) => plot.id),
        {
          groupName: groupName.trim(),
          type: category,
          placements,
        }
      )
      updatePlotRows(updated)
      onGrouped(
        `${updated.length} plot${updated.length === 1 ? "" : "s"} grouped as ${groupName.trim()} — ${rowCount} × ${columnCount} ${mode}.`
      )
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  const previewCells = fits ? Math.min(capacity, 60) : 0

  return (
    <Modal
      open
      onClose={onClose}
      title="Group Plots as a Grid"
      description={`${plots.length} plot${plots.length === 1 ? "" : "s"} selected. Choose a row, column, or grid layout.`}
    >
      <form onSubmit={saveGroup} className="space-y-3">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div>
          <label className={LABEL} htmlFor="grid-group-name">
            Group name
          </label>
          <input
            id="grid-group-name"
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Block A"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="grid-group-category">
            Type
          </label>
          <select
            id="grid-group-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as PlotCategory)}
            className={INPUT}
          >
            {PLOT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className={LABEL}>Layout</span>
          <div className="flex overflow-hidden rounded-lg border border-deep/30">
            {(
              [
                { key: "row", label: "Row" },
                { key: "column", label: "Column" },
                { key: "grid", label: "Grid" },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => chooseMode(option.key)}
                className={`flex-1 px-3 py-1.5 text-sm transition-colors ${
                  mode === option.key
                    ? "bg-navy text-cream"
                    : "text-navy hover:bg-deep/5"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor="grid-group-rows">
              Rows
            </label>
            <input
              id="grid-group-rows"
              type="number"
              min={1}
              max={500}
              required
              value={rows}
              onChange={(e) => {
                setMode("grid")
                setRows(e.target.value)
              }}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="grid-group-columns">
              Columns
            </label>
            <input
              id="grid-group-columns"
              type="number"
              min={1}
              max={500}
              required
              value={columns}
              onChange={(e) => {
                setMode("grid")
                setColumns(e.target.value)
              }}
              className={INPUT}
            />
          </div>
        </div>

        <div className="rounded-xl border border-deep/15 bg-cream/50 p-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-deep">
              <LayoutGrid size={13} /> Preview
            </span>
            <span className="text-deep/60">
              {plots.length} plot{plots.length === 1 ? "" : "s"} · {rowCount} ×{" "}
              {columnCount}
            </span>
          </div>
          {fits ? (
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
                maxWidth: "240px",
              }}
            >
              {Array.from({ length: previewCells }).map((_, index) => (
                <span
                  key={index}
                  className={`aspect-square rounded-[3px] ${
                    index < plots.length ? "bg-teal/70" : "bg-deep/10"
                  }`}
                />
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-red-700">
              A {rowCount} × {columnCount} grid holds {capacity} cell
              {capacity === 1 ? "" : "s"} — select fewer plots or add more rows
              or columns.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className={GHOST}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !fits || !groupName.trim()}
            className={PRIMARY}
          >
            {busy ? "Grouping..." : "Group as Grid"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
