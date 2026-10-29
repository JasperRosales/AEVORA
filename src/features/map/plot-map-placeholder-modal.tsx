import { Grip, Minus, Plus, RotateCcw, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Modal } from "@/components/ui/modal"
import { PLOT_CATEGORIES, plotCategoryStroke } from "@/lib/plot-category"
import {
  fetchMapPlaceholder,
  saveMapPlaceholder,
  type MapPlaceholderPlacement,
} from "@/lib/neon-api"
import type { Cemetery, Plot } from "@/types/domain"

const LABEL = "mb-1 block text-xs font-medium text-deep"
const INPUT =
  "w-24 rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm outline-none focus:border-teal"
const PRIMARY =
  "rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
const GHOST = "neu-button px-4 py-2 text-sm"

function defaultGrid(plotCount: number) {
  if (plotCount === 0) return { rows: 5, columns: 5 }
  const columns = Math.ceil(Math.sqrt(plotCount))
  return { rows: Math.ceil(plotCount / columns), columns }
}

function cellKey(row: number, column: number) {
  return `${row}:${column}`
}

export function PlotMapPlaceholderModal({
  cemetery,
  plots,
  onClose,
  onSaved,
}: {
  cemetery: Cemetery
  plots: Plot[]
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const defaults = useMemo(() => defaultGrid(plots.length), [plots.length])
  const [rows, setRows] = useState(defaults.rows)
  const [columns, setColumns] = useState(defaults.columns)
  const [placements, setPlacements] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [sortSuggestions, setSortSuggestions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetchMapPlaceholder(cemetery.id)
      .then((saved) => {
        if (!active) return
        if (saved.rows > 0 && saved.columns > 0) {
          setRows(saved.rows)
          setColumns(saved.columns)
        }
        setPlacements(
          new Map(
            saved.placements.map((placement) => [
              cellKey(placement.row, placement.column),
              placement.plotId,
            ])
          )
        )
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err))
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [cemetery.id])

  const plotsById = useMemo(
    () => new Map(plots.map((plot) => [plot.id, plot])),
    [plots]
  )
  const currentPlacements = useMemo(
    () =>
      new Map(
        [...placements].filter(
          ([key, plotId]) =>
            plotsById.has(plotId) &&
            Number(key.split(":")[0]) <= rows &&
            Number(key.split(":")[1]) <= columns
        )
      ),
    [placements, plotsById, rows, columns]
  )
  const placedIds = useMemo(
    () => new Set(currentPlacements.values()),
    [currentPlacements]
  )
  const unplacedPlots = plots
    .filter((plot) => !placedIds.has(plot.id))
    .sort((a, b) => {
      if (!sortSuggestions) return 0
      const typeOrder =
        PLOT_CATEGORIES.indexOf(a.type) - PLOT_CATEGORIES.indexOf(b.type)
      return (
        typeOrder ||
        a.plotNumber.localeCompare(b.plotNumber, undefined, { numeric: true })
      )
    })
  const cells = useMemo(
    () =>
      Array.from({ length: rows * columns }, (_, index) => ({
        row: Math.floor(index / columns) + 1,
        column: (index % columns) + 1,
      })),
    [rows, columns]
  )

  function resizeGrid(nextRows: number, nextColumns: number) {
    if (nextRows * nextColumns > 1000) {
      setError("The grid can contain at most 1,000 cells.")
      return
    }
    setError(null)
    setRows(nextRows)
    setColumns(nextColumns)
    setPlacements((current) => {
      const next = new Map<string, string>()
      for (const [key, plotId] of current) {
        const [row, column] = key.split(":").map(Number)
        if (row <= nextRows && column <= nextColumns) next.set(key, plotId)
      }
      return next
    })
  }

  function autoComplete() {
    setSortSuggestions(true)
  }

  function dropPlot(
    event: React.DragEvent<HTMLElement>,
    row: number,
    column: number
  ) {
    event.preventDefault()
    const plotId = event.dataTransfer.getData("text/plot-id")
    if (!plotsById.has(plotId)) return

    const targetKey = cellKey(row, column)
    const sourceKey = event.dataTransfer.getData("text/source-cell")
    setPlacements((current) => {
      const next = new Map(current)
      const displacedPlot = next.get(targetKey)
      if (sourceKey && sourceKey !== targetKey) {
        if (displacedPlot) next.set(sourceKey, displacedPlot)
        else next.delete(sourceKey)
      }
      next.set(targetKey, plotId)
      return next
    })
  }

  function returnToUnplaced(event: React.DragEvent<HTMLElement>) {
    event.preventDefault()
    const plotId = event.dataTransfer.getData("text/plot-id")
    const sourceKey = event.dataTransfer.getData("text/source-cell")
    if (!plotsById.has(plotId) || !sourceKey) return
    setPlacements((current) => {
      const next = new Map(current)
      next.delete(sourceKey)
      return next
    })
  }

  async function save() {
    if (rows * columns > 1000) {
      setError("The grid can contain at most 1,000 cells.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const nextPlacements: MapPlaceholderPlacement[] = []
      for (const [key, plotId] of currentPlacements) {
        const [row, column] = key.split(":").map(Number)
        nextPlacements.push({ row, column, plotId })
      }
      await saveMapPlaceholder(cemetery.id, {
        rows,
        columns,
        placements: nextPlacements,
      })
      await onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Map Placeholder — ${cemetery.name}`}
      description="Set a grid for this cemetery and drag plots into the positions you want. Empty grid cells are allowed."
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span>
            {placedIds.size} of {plots.length} plots placed
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={GHOST}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void save()}
              disabled={loading || busy}
              className={PRIMARY}
            >
              {busy ? "Saving..." : "Save Map"}
            </button>
          </div>
        </div>
      }
    >
      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label>
          <span className={LABEL}>Rows</span>
          <input
            aria-label="Grid rows"
            className={INPUT}
            type="number"
            min={1}
            max={1000}
            value={rows}
            onChange={(event) =>
              resizeGrid(Math.max(1, Number(event.target.value) || 1), columns)
            }
          />
        </label>
        <label>
          <span className={LABEL}>Columns</span>
          <input
            aria-label="Grid columns"
            className={INPUT}
            type="number"
            min={1}
            max={1000}
            value={columns}
            onChange={(event) =>
              resizeGrid(rows, Math.max(1, Number(event.target.value) || 1))
            }
          />
        </label>
        <button
          type="button"
          className={`${GHOST} flex items-center gap-1`}
          onClick={() => setPlacements(new Map())}
          disabled={placements.size === 0}
        >
          <RotateCcw size={13} /> Clear placements
        </button>
        <button
          type="button"
          className={`${GHOST} flex items-center gap-1`}
          onClick={autoComplete}
          disabled={loading || unplacedPlots.length === 0}
          title="Sort unplaced plots by type, then plot number"
        >
          <Sparkles size={13} /> Auto-complete
        </button>
        {loading && (
          <span className="pb-2 text-xs text-deep/60">Loading map…</span>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
        <div className="max-h-[55svh] overflow-auto rounded-xl border border-deep/10 bg-white/40 p-2">
          <div className="sticky top-0 z-10 mb-2 flex w-fit items-center gap-1 rounded-lg border border-deep/10 bg-cream/95 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setZoom((current) => Math.max(0.5, current - 0.1))}
              disabled={zoom <= 0.5}
              aria-label="Zoom out placeholder grid"
              title="Zoom out"
              className="neu-button rounded-md p-1.5 disabled:opacity-40"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-10 text-center text-xs text-deep/70">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((current) => Math.min(2, current + 0.1))}
              disabled={zoom >= 2}
              aria-label="Zoom in placeholder grid"
              title="Zoom in"
              className="neu-button rounded-md p-1.5 disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </div>
          <div
            className="grid min-w-max gap-2"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(100px, 1fr))`,
              zoom,
            }}
          >
            {cells.map(({ row, column }) => {
              const key = cellKey(row, column)
              const plotId = currentPlacements.get(key)
              const plot = plotId ? plotsById.get(plotId) : undefined
              return (
                <div
                  key={key}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => dropPlot(event, row, column)}
                  className={`flex min-h-20 flex-col justify-between rounded-lg border p-2 ${
                    plot ? "border-deep/20" : "border-dashed border-deep/25"
                  }`}
                  style={
                    plot
                      ? {
                          backgroundColor: `${plotCategoryStroke[plot.type]}25`,
                        }
                      : undefined
                  }
                >
                  <span className="text-[10px] font-medium text-deep/50">
                    Row {row}, Col {column}
                  </span>
                  {plot ? (
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plot-id", plot.id)
                        event.dataTransfer.setData("text/source-cell", key)
                        event.dataTransfer.effectAllowed = "move"
                      }}
                      onClick={() =>
                        setPlacements((current) => {
                          const next = new Map(current)
                          next.delete(key)
                          return next
                        })
                      }
                      title={`${plot.type} — click to unplace`}
                      className="flex items-center gap-1 text-left text-xs font-semibold text-deep"
                    >
                      <Grip size={13} />
                      {plot.plotNumber}
                      <span className="text-[10px] font-normal text-deep/60">
                        {plot.type}
                      </span>
                    </button>
                  ) : (
                    <span className="text-xs text-deep/35">Empty</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <aside
          onDragOver={(event) => event.preventDefault()}
          onDrop={returnToUnplaced}
          className="min-h-32 rounded-xl border border-dashed border-deep/20 bg-cream/60 p-3"
        >
          <h3 className="mb-2 text-xs font-semibold text-deep">
            Unplaced plots ({unplacedPlots.length})
          </h3>
          <p className="mb-2 text-[10px] text-deep/50">
            Drop a placed plot here to unplace it.
          </p>
          {unplacedPlots.length === 0 ? (
            <p className="text-xs text-deep/50">All plots are on the grid.</p>
          ) : (
            <div className="flex max-h-[50svh] flex-col gap-1.5 overflow-auto">
              {sortSuggestions && (
                <p className="mb-1 text-[10px] text-deep/55">
                  Suggested order: type, then plot number. Drag plots onto any
                  grid cell; empty cells are preserved.
                </p>
              )}
              {unplacedPlots.map((plot) => (
                <button
                  key={plot.id}
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plot-id", plot.id)
                    event.dataTransfer.setData("text/source-cell", "")
                    event.dataTransfer.effectAllowed = "move"
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-deep/10 bg-white/60 px-2 py-1.5 text-left text-xs font-medium text-deep"
                >
                  <Grip size={13} className="shrink-0 text-deep/50" />
                  <span>{plot.plotNumber}</span>
                  <span className="ml-auto text-[10px] text-deep/55">
                    {plot.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
    </Modal>
  )
}
