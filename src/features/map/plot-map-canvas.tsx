import { LayoutGrid, Plus } from "lucide-react"
import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { plotStatusFill } from "@/lib/status"
import type { BurialType, Plot, PlotStatus } from "@/types/domain"
import { PlotLandMap, type LandMapPlot } from "./plot-land-map"

const SECTION_COLUMN_OPTIONS = [1, 2, 3, 4] as const
const STATUSES = Object.keys(plotStatusFill) as PlotStatus[]

const collator = new Intl.Collator(undefined, { numeric: true })

function shortLabel(plotNumber: string): string {
  const dash = plotNumber.indexOf("-")
  return dash === -1 ? plotNumber : plotNumber.slice(dash + 1)
}

/**
 * The staff site-plan map. Sections are drawn as land parcels whose proportions
 * follow their plot grid, so a wide block reads as a rectangle, a 6×6 block as
 * a square, and a 10×10 block as a large square. Staff can select any plot,
 * change its status from the palette, or open the grid builder to add a new
 * parcel of plots. Plots outside the active filters dim instead of vanishing.
 */
export function PlotMapCard({
  plots,
  cemeteryId,
  burialType,
  section,
  status,
  selected,
  onSelect,
  onBuildGrid,
  onStatusChange,
  statusBusy = false,
  statusError = null,
  sectionColumns,
  onSectionColumnsChange,
}: {
  plots: Plot[]
  cemeteryId: string
  burialType: BurialType | "All"
  section: string
  status: PlotStatus | "All"
  selected: Plot | null
  onSelect: (plot: Plot | null) => void
  onBuildGrid?: () => void
  onStatusChange: (plot: Plot, status: PlotStatus) => void
  statusBusy?: boolean
  statusError?: string | null
  sectionColumns: number
  onSectionColumnsChange: (columns: number) => void
}) {
  const mapData = useMemo(() => {
    const cemeteryPlots = plots.filter((p) => p.cemeteryId === cemeteryId)
    const names = [...new Set(cemeteryPlots.map((p) => p.section))].sort(
      collator.compare
    )
    const sections = names.map((name) => ({
      name,
      plots: cemeteryPlots
        .filter((p) => p.section === name)
        .map((p) => ({
          id: p.id,
          label: shortLabel(p.plotNumber),
          row: p.row,
          column: p.column,
          status: p.status,
          type: p.type,
        })),
    }))
    const visibleIds = new Set(
      cemeteryPlots
        .filter(
          (p) =>
            (burialType === "All" || p.type === burialType) &&
            (section === "All" || p.section === section) &&
            (status === "All" || p.status === status)
        )
        .map((p) => p.id)
    )
    return { sections, visibleIds }
  }, [plots, cemeteryId, burialType, section, status])

  const sectionRows = Math.max(
    1,
    Math.ceil(mapData.sections.length / sectionColumns)
  )

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
          {onBuildGrid && (
            <button
              onClick={onBuildGrid}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep"
            >
              Build plot grid
            </button>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card
      title="Cemetery Map"
      action={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="hidden text-[11px] text-deep/50 sm:inline">
            {sectionColumns} col × {sectionRows} row
            {sectionRows === 1 ? "" : "s"}
          </span>
          <label className="sr-only" htmlFor="map-section-columns">
            Map layout columns
          </label>
          <select
            id="map-section-columns"
            value={sectionColumns}
            onChange={(e) => onSectionColumnsChange(Number(e.target.value))}
            className="rounded-lg border border-deep/25 bg-cream px-2 py-1 text-xs outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
          >
            {SECTION_COLUMN_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count} column{count === 1 ? "" : "s"}
              </option>
            ))}
          </select>
          {onBuildGrid && (
            <button
              type="button"
              onClick={onBuildGrid}
              className="neu-button flex items-center gap-1 px-2.5 py-1.5 text-xs"
            >
              <Plus size={13} /> Add plots
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
                    active ? "ring-2 ring-navy ring-offset-1 ring-offset-cream" : ""
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

      <div className="overflow-hidden rounded-xl">
        <PlotLandMap
          sections={mapData.sections}
          sectionColumns={sectionColumns}
          selectedId={selected?.id ?? null}
          onSelect={(id) => {
            const plot = plots.find((p) => p.id === id)
            if (plot) onSelect(plot)
          }}
          onBackgroundClick={() => onSelect(null)}
          isDimmed={(plot: LandMapPlot) => !mapData.visibleIds.has(plot.id)}
          ariaLabel="Cemetery plot map"
        />
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
