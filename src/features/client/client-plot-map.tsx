import { MapPin } from "lucide-react"
import { motion } from "motion/react"
import { Modal } from "@/components/ui/modal"
import { StatusBadge } from "@/components/ui/status-badge"
import type { ClientPlot } from "@/lib/client-api"
import { plotStatusFill } from "@/lib/status"
import type { BurialType, PlotStatus } from "@/types/domain"
import { PlotLandMap } from "../map/plot-land-map"
import { Card, pesos } from "./client-ui"

const LEGEND: PlotStatus[] = [
  "Available",
  "Reserved",
  "Occupied",
  "Waiting for Checking",
  "Unavailable",
]

const collator = new Intl.Collator(undefined, { numeric: true })

function shortLabel(plotNumber: string): string {
  const dash = plotNumber.indexOf("-")
  return dash === -1 ? plotNumber : plotNumber.slice(dash + 1)
}

/**
 * The family-facing site plan. It uses the same land drawing as the office map,
 * so parcels keep their real proportions and every status is visible. The type
 * filter dims non-matching cells instead of hiding them, and only Available
 * cells can be reserved.
 */
export function ClientPlotMap({
  plots,
  cemetery,
  type,
  onSelect,
}: {
  plots: ClientPlot[]
  cemetery: string
  type: BurialType | "All"
  onSelect: (plot: ClientPlot) => void
}) {
  const cemeteryPlots = plots.filter((p) => p.cemetery === cemetery)
  const sections = [
    ...new Set(cemeteryPlots.map((p) => p.section)),
  ]
    .sort(collator.compare)
    .map((name) => ({
      name,
      plots: cemeteryPlots
        .filter((p) => p.section === name)
        .map((p) => ({
          id: p.id,
          label: shortLabel(p.plot_number),
          row: p.row,
          column: p.column,
          status: p.status,
          type: p.type,
        })),
    }))

  if (sections.length === 0) {
    return (
      <Card>
        <p className="text-sm text-deep/70">
          No plots have been laid out in this cemetery yet.
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <div className="overflow-hidden rounded-xl">
        <PlotLandMap
          sections={sections}
          sectionColumns={1}
          onSelect={(id) => {
            const plot = cemeteryPlots.find((p) => p.id === id)
            if (plot) onSelect(plot)
          }}
          isDimmed={(plot) => type !== "All" && plot.type !== type}
          ariaLabel={`Plot map for ${cemetery}`}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[10px] text-deep/60">
        {LEGEND.map((status) => (
          <span key={status} className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-[2px]"
              style={{
                backgroundColor: plotStatusFill[status].fill,
                border: plotStatusFill[status].stroke
                  ? `1px solid ${plotStatusFill[status].stroke}`
                  : undefined,
              }}
            />
            {status}
          </span>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-deep/50">
        Tap a plot to see its details. Green plots are available to reserve.
      </p>
    </Card>
  )
}

/** Bottom sheet shown after tapping a cell on the family-facing map. */
export function ClientPlotDetailsSheet({
  plot,
  onClose,
  onReserve,
}: {
  plot: ClientPlot
  onClose: () => void
  onReserve: (plot: ClientPlot) => void
}) {
  const canReserve = plot.status === "Available"

  return (
    <Modal
      open
      onClose={onClose}
      title={`Plot ${plot.plot_number}`}
      description={`${plot.cemetery} — ${plot.location}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <StatusBadge status={plot.status} />
          <p className="text-xl font-bold text-navy">{pesos(plot.price)}</p>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Section
            </dt>
            <dd className="font-medium">{plot.section}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Row / Column
            </dt>
            <dd className="font-medium">
              {plot.row} / {plot.column}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Burial type
            </dt>
            <dd className="font-medium">{plot.type}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Size
            </dt>
            <dd className="font-medium">{plot.size}</dd>
          </div>
        </dl>

        <p className="flex items-start gap-1.5 rounded-xl bg-cream px-3 py-2.5 text-[11px] text-deep/70">
          <MapPin size={12} className="mt-0.5 shrink-0" />
          {plot.cemetery} — {plot.location}
        </p>

        {canReserve ? (
          <motion.button
            type="button"
            onClick={() => onReserve(plot)}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-cream transition active:bg-deep"
          >
            Reserve this plot
          </motion.button>
        ) : (
          <p className="rounded-xl bg-cream px-3 py-2.5 text-xs text-deep/70">
            This plot is currently {plot.status.toLowerCase()} and can&apos;t be
            reserved right now. Pick a green plot on the map.
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-1 text-xs font-medium text-deep/60 transition hover:text-deep"
        >
          Back to map
        </button>
      </div>
    </Modal>
  )
}
