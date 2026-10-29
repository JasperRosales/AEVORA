import {
  Layers,
  LayoutGrid,
  Move,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { PLOT_CATEGORIES, plotCategoryStroke } from "@/lib/plot-category"
import { plotStatusFill } from "@/lib/status"
import type { Plot, PlotCategory, PlotStatus } from "@/types/domain"
import { PlotLandMap, type LandMapPlot } from "./plot-land-map"

const STATUSES = Object.keys(plotStatusFill) as PlotStatus[]

/**
 * The staff site-plan map. All plots displayed freely for customization.
 */
export function PlotMapCard({
  plots,
  cemeteryId,
  category,
  section,
  status,
  search,
  selected,
  onSelect,
  onAddPlot,
  onDeletePlot,
  onGroupPlots,
  onGridGroupPlots,
  onStatusChange,
  statusBusy = false,
  statusError = null,
  sectionColumns,
}: {
  plots: Plot[]
  cemeteryId: string
  category: PlotCategory | "All"
  section: string
  status: PlotStatus | "All"
  search: string
  selected: Plot | null
  onSelect: (plot: Plot | null) => void
  onAddPlot?: () => void
  onDeletePlot?: (plot: Plot) => void
  onGroupPlots?: (plots: Plot[]) => void
  onGridGroupPlots?: (plots: Plot[]) => void
  onStatusChange: (plot: Plot, status: PlotStatus) => void
  statusBusy?: boolean
  statusError?: string | null
  sectionColumns: number
  onSectionColumnsChange: (columns: number) => void
}) {
  const [isDraggable, setIsDraggable] = useState(false)
  const [selectedPlots, setSelectedPlots] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(1)

  const mapData = useMemo(() => {
    const cemeteryPlots = plots.filter((p) => p.cemeteryId === cemeteryId)
    const query = search.trim().toLowerCase()
    const sections = [
      {
        name: "All",
        plots: cemeteryPlots.map((p) => ({
          id: p.id,
          label: p.plotNumber,
          row: p.row,
          column: p.column,
          status: p.status,
          category: p.type,
          groupName: p.groupName,
        })),
      },
    ]
    const visibleIds = new Set(
      cemeteryPlots
        .filter(
          (p) =>
            (category === "All" || p.type === category) &&
            (section === "All" || p.section === section) &&
            (status === "All" || p.status === status) &&
            (!query || p.plotNumber.toLowerCase().includes(query))
        )
        .map((p) => p.id)
    )
    return { sections, visibleIds }
  }, [plots, cemeteryId, category, section, status, search])

  const groups = useMemo(() => {
    const byName = new Map<
      string,
      { name: string; category: Plot["type"]; count: number }
    >()
    for (const plot of plots) {
      if (plot.cemeteryId !== cemeteryId || !plot.groupName) continue
      const existing = byName.get(plot.groupName)
      if (existing) existing.count += 1
      else
        byName.set(plot.groupName, {
          name: plot.groupName,
          category: plot.type,
          count: 1,
        })
    }
    return [...byName.values()]
  }, [plots, cemeteryId])

  if (mapData.sections[0].plots.length === 0) {
    return (
      <Card title="Cemetery Map">
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <LayoutGrid size={28} className="text-deep/30" />
          <div>
            <p className="text-sm font-medium text-deep">
              No plots laid out in this cemetery yet.
            </p>
            <p className="mt-1 text-xs text-deep/60">
              Build a grid to create a whole block of plots at once.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      title="Cemetery Map"
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}
            className="neu-button flex items-center gap-1 px-2.5 py-1.5 text-xs"
            title="Zoom out"
          >
            <ZoomOut size={13} />
          </button>
          <span className="text-xs text-deep/60">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, z + 0.1))}
            className="neu-button flex items-center gap-1 px-2.5 py-1.5 text-xs"
            title="Zoom in"
          >
            <ZoomIn size={13} />
          </button>
          <button
            type="button"
            onClick={() => setIsDraggable(!isDraggable)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
              isDraggable ? "bg-navy text-cream" : "neu-button"
            }`}
          >
            <Move size={13} /> {isDraggable ? "Done" : "Move"}
          </button>
          {onGroupPlots && (
            <button
              type="button"
              disabled={selectedPlots.size < 2}
              onClick={() => {
                const chosen = plots.filter((p) => selectedPlots.has(p.id))
                if (chosen.length >= 2) onGroupPlots(chosen)
              }}
              title={
                selectedPlots.size < 2
                  ? "Ctrl/Shift-click to select at least two plots"
                  : `Group ${selectedPlots.size} selected plots`
              }
              className="neu-button flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Layers size={13} /> Group
              {selectedPlots.size > 0 ? ` (${selectedPlots.size})` : ""}
            </button>
          )}
          {onGridGroupPlots && (
            <button
              type="button"
              disabled={selectedPlots.size < 2}
              onClick={() => {
                const chosen = plots.filter((p) => selectedPlots.has(p.id))
                if (chosen.length >= 2) onGridGroupPlots(chosen)
              }}
              title={
                selectedPlots.size < 2
                  ? "Ctrl/Shift-click to select at least two plots"
                  : `Group ${selectedPlots.size} selected plots as a row, column, or grid`
              }
              className="neu-button flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LayoutGrid size={13} /> Grid group
              {selectedPlots.size > 0 ? ` (${selectedPlots.size})` : ""}
            </button>
          )}
          {onDeletePlot && (
            <button
              type="button"
              disabled={!selected}
              onClick={() => {
                if (selected) onDeletePlot(selected)
              }}
              title={
                selected
                  ? `Delete plot ${selected.plotNumber}`
                  : "Select a plot to delete"
              }
              className="neu-button flex items-center gap-1 px-2.5 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={13} /> Delete plot
            </button>
          )}
          {onAddPlot && (
            <button
              type="button"
              onClick={onAddPlot}
              className="neu-button flex items-center gap-1 px-2.5 py-1.5 text-xs"
            >
              <Plus size={13} /> Add plot
            </button>
          )}
        </div>
      }
    >
      <div className="mb-3 rounded-xl border border-deep/10 bg-cream/40 p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-xs font-medium text-deep">
            {selected
              ? `Plot ${selected.plotNumber} — set status`
              : selectedPlots.size > 0
                ? `${selectedPlots.size} plots selected — Ctrl/Shift-click to add more`
                : "Select a plot, or Ctrl/Shift-click to select several"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((option) => {
              const fill = plotStatusFill[option]
              const dark =
                option === "Unavailable" || option === "Waiting for Checking"
              const active = selected?.status === option
              return (
                <button
                  key={option}
                  type="button"
                  disabled={!selected || statusBusy}
                  aria-pressed={active}
                  onClick={() => {
                    if (selected) onStatusChange(selected, option)
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? "ring-2 ring-navy ring-offset-1 ring-offset-cream"
                      : ""
                  } ${dark ? "text-deep/70" : "text-white/90"}`}
                  style={{
                    backgroundColor: fill.fill,
                    borderColor: fill.stroke ?? "transparent",
                  }}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>
        {statusBusy && (
          <p className="mt-1.5 text-[10px] text-deep/60">
            Updating plot status…
          </p>
        )}
        {statusError && (
          <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">
            {statusError}
          </p>
        )}
      </div>

      <div
        className="overflow-auto rounded-xl"
        style={{ maxHeight: "600px", background: "#f8f6f0" }}
      >
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            width: `${100 / zoom}%`,
          }}
        >
          <PlotLandMap
            sections={mapData.sections}
            sectionColumns={sectionColumns}
            selectedId={selected?.id ?? null}
            onSelect={(id, event) => {
              const plot = plots.find((p) => p.id === id)
              if (!plot) return
              if (isDraggable) {
                const next = new Set(selectedPlots)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                setSelectedPlots(next)
                return
              }
              const additive = event.ctrlKey || event.metaKey || event.shiftKey
              if (additive) {
                const next = new Set(selectedPlots)
                if (next.has(id)) {
                  next.delete(id)
                  if (selected?.id === id) {
                    const lastId = [...next][next.size - 1]
                    onSelect(
                      lastId
                        ? (plots.find((p) => p.id === lastId) ?? null)
                        : null
                    )
                  }
                } else {
                  next.add(id)
                  onSelect(plot)
                }
                setSelectedPlots(next)
                return
              }
              setSelectedPlots(new Set([id]))
              onSelect(plot)
            }}
            onBackgroundClick={() => {
              if (!isDraggable) onSelect(null)
              setSelectedPlots(new Set())
            }}
            isDimmed={(plot: LandMapPlot) => !mapData.visibleIds.has(plot.id)}
            ariaLabel="Cemetery plot map"
            draggable={isDraggable}
            unified={true}
            customCols={undefined}
            plotDraggable={isDraggable}
            selectedPlots={selectedPlots}
          />
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-semibold text-deep/60">Plot type:</span>
          {PLOT_CATEGORIES.map((type) => (
            <span key={type} className="flex items-center gap-1">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: plotCategoryStroke[type] }}
              />
              {type}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-semibold text-deep/60">Status:</span>
          {STATUSES.map((option) => {
            const status = plotStatusFill[option]
            return (
              <span key={option} className="flex items-center gap-1">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white"
                  style={{ backgroundColor: status.stroke ?? status.fill }}
                />
                {option}
              </span>
            )
          })}
        </div>
      </div>

      {groups.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-deep/10 pt-3 text-xs">
          <span className="font-semibold text-deep/60">Groups</span>
          {groups.map((group) => {
            const stroke = plotCategoryStroke[group.category]
            return (
              <span
                key={group.name}
                className="flex items-center gap-1.5 rounded-full border bg-cream/60 px-2.5 py-1 font-medium text-deep"
                style={{ borderColor: stroke }}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stroke }}
                />
                {group.name}
                <span className="text-deep/50">({group.count})</span>
              </span>
            )
          })}
        </div>
      )}
    </Card>
  )
}