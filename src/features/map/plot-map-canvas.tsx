import { LayoutGrid, Move, Plus, ZoomIn, ZoomOut } from "lucide-react"
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { plotStatusFill } from "@/lib/status"
import type { BurialType, Plot, PlotStatus } from "@/types/domain"
import { PlotLandMap, type LandMapPlot } from "./plot-land-map"

const STATUSES = Object.keys(plotStatusFill) as PlotStatus[]

/**
 * The staff site-plan map. All plots displayed freely for customization.
 */
export function PlotMapCard({
  plots,
  cemeteryId,
  burialType,
  section,
  status,
  search,
  selected,
  onSelect,
  onAddPlot,
  onStatusChange,
  statusBusy = false,
  statusError = null,
  sectionColumns,
}: {
  plots: Plot[]
  cemeteryId: string
  burialType: BurialType | "All"
  section: string
  status: PlotStatus | "All"
  search: string
  selected: Plot | null
  onSelect: (plot: Plot | null) => void
  onAddPlot?: () => void
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
    const sections = [
      {
        name: "All",
        plots: cemeteryPlots.map((p) => ({
          id: p.id,
          label: p.plotNumber,
          row: p.row,
          column: p.column,
          status: p.status,
          type: p.type,
        })),
      },
    ]
    const query = search.trim().toLowerCase()
    const visibleIds = new Set(
      cemeteryPlots
        .filter(
          (p) =>
            (burialType === "All" || p.type === burialType) &&
            (section === "All" || p.section === section) &&
            (status === "All" || p.status === status) &&
            (!query || p.plotNumber.toLowerCase().includes(query))
        )
        .map((p) => p.id)
    )
    return { sections, visibleIds }
  }, [plots, cemeteryId, burialType, section, status, search])

  if (mapData.sections.length === 0) {
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
              : "Select a plot to set its status"}
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
            onSelect={(id) => {
              if (isDraggable) {
                const plot = plots.find((p) => p.id === id)
                if (plot) {
                  const newSet = new Set(selectedPlots)
                  if (newSet.has(id)) newSet.delete(id)
                  else newSet.add(id)
                  setSelectedPlots(newSet)
                  if (!isDraggable) onSelect(plot)
                }
                return
              }
              const plot = plots.find((p) => p.id === id)
              if (plot) onSelect(plot)
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

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {STATUSES.map((option) => (
          <span key={option} className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{
                backgroundColor: plotStatusFill[option].fill,
                border: plotStatusFill[option].stroke
                  ? `1px solid ${plotStatusFill[option].stroke}`
                  : undefined,
              }}
            />
            {option}
          </span>
        ))}
      </div>
    </Card>
  )
}