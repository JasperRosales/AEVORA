import { LayoutGrid, Maximize, Minus, Plus } from "lucide-react"
import { useState } from "react"
import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { EASE_OUT, stagger, staggerItem } from "@/lib/motion"
import { plotStatusFill } from "@/lib/status"
import type { BurialType, Plot, PlotStatus } from "@/types/domain"

const statusFill = Object.fromEntries(
  Object.entries(plotStatusFill).map(([k, v]) => [k, v.fill])
) as Record<PlotStatus, string>

const CELL = 16
const GAP = 4
const HEADER = 14
const TOP = 40
const SECTION_COLS = 2
const SECTION_GAP_X = 40
const SECTION_GAP_Y = 24

const collator = new Intl.Collator(undefined, { numeric: true })

/**
 * The interactive SVG plot map. Sections and grid dimensions are derived from
 * the plots themselves, so a cemetery laid out with the grid builder (any
 * number of sections, rows or columns) renders without code changes. Plots
 * outside the active filters dim to 15%; selecting a cell opens its details.
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
}: {
  plots: Plot[]
  cemeteryId: string
  burialType: BurialType | "All"
  section: string
  status: PlotStatus | "All"
  selected: Plot | null
  onSelect: (plot: Plot) => void
  onBuildGrid?: () => void
}) {
  const [zoom, setZoom] = useState(1)

  const cemeteryPlots = plots.filter((p) => p.cemeteryId === cemeteryId)
  const sections = [...new Set(cemeteryPlots.map((p) => p.section))].sort(
    collator.compare
  )
  const maxRow = Math.max(1, ...cemeteryPlots.map((p) => p.row))
  const maxCol = Math.max(1, ...cemeteryPlots.map((p) => p.column))

  const sectionW = maxCol * (CELL + GAP) + GAP
  const gridH = maxRow * (CELL + GAP) - GAP
  const sectionH = HEADER + GAP + gridH + GAP
  const rowsOfSections = Math.max(1, Math.ceil(sections.length / SECTION_COLS))
  const width = Math.max(320, TOP + SECTION_COLS * (sectionW + SECTION_GAP_X))
  const height = TOP + rowsOfSections * (sectionH + SECTION_GAP_Y) + 4

  if (sections.length === 0) {
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
        <div className="flex gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
            className="neu-button rounded-lg p-1.5"
            title="Zoom in"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
            className="neu-button rounded-lg p-1.5"
            title="Zoom out"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="neu-button rounded-lg p-1.5"
            title="Reset view"
          >
            <Maximize size={14} />
          </button>
        </div>
      }
    >
      <div className="overflow-auto">
        <svg
          width={width}
          height={height}
          className="bg-cream transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          <text x={20} y={20} className="fill-deep text-xs">
            Main Entrance
          </text>
          {sections.map((sec, i) => {
            const originX =
              TOP + (i % SECTION_COLS) * (sectionW + SECTION_GAP_X)
            const originY =
              TOP + Math.floor(i / SECTION_COLS) * (sectionH + SECTION_GAP_Y)
            return (
              <g key={sec}>
                <text
                  x={originX}
                  y={originY - 4}
                  className="fill-navy text-xs font-semibold"
                >
                  Section {sec}
                </text>
                <rect
                  x={originX}
                  y={originY}
                  width={sectionW}
                  height={sectionH}
                  rx={6}
                  fill="#102B52"
                  opacity={0.08}
                />
                {Array.from({ length: maxCol }).map((_, col) => (
                  <text
                    key={`col-${col}`}
                    x={originX + GAP + col * (CELL + GAP) + CELL / 2}
                    y={originY + HEADER - 4}
                    textAnchor="middle"
                    className="fill-deep"
                    style={{ fontSize: 7, opacity: 0.5 }}
                  >
                    {col + 1}
                  </text>
                ))}
                {cemeteryPlots
                  .filter((p) => p.section === sec)
                  .map((p) => {
                    const matches =
                      (burialType === "All" || p.type === burialType) &&
                      (section === "All" || p.section === section) &&
                      (status === "All" || p.status === status)
                    const targetOpacity = matches
                      ? (plotStatusFill[p.status].fillOpacity ?? 1)
                      : 0.15
                    return (
                      <motion.rect
                        key={p.id}
                        x={originX + GAP + (p.column - 1) * (CELL + GAP)}
                        y={originY + HEADER + GAP + (p.row - 1) * (CELL + GAP)}
                        width={CELL}
                        height={CELL}
                        rx={2}
                        initial={{ opacity: 0, fillOpacity: targetOpacity }}
                        animate={{ opacity: 1, fillOpacity: targetOpacity }}
                        transition={{
                          duration: 0.35,
                          ease: EASE_OUT,
                          delay: Math.min(0.35, (p.row + p.column) * 0.012),
                        }}
                        style={{
                          fill: plotStatusFill[p.status].fill,
                          stroke:
                            selected?.id === p.id
                              ? "var(--color-navy)"
                              : (plotStatusFill[p.status].stroke ?? "none"),
                          strokeWidth: selected?.id === p.id ? 2 : 1,
                          transition:
                            "stroke 180ms ease, stroke-width 180ms ease",
                        }}
                        className="cursor-pointer"
                        onClick={() => onSelect(p)}
                      >
                        <title>
                          {p.plotNumber} — {p.status}
                        </title>
                      </motion.rect>
                    )
                  })}
              </g>
            )
          })}
        </svg>
      </div>
      <motion.div
        variants={stagger(0.04)}
        initial="hidden"
        animate="show"
        className="mt-3 flex flex-wrap items-center gap-3 text-xs"
      >
        {(Object.keys(statusFill) as PlotStatus[]).map((s) => (
          <motion.span
            key={s}
            variants={staggerItem}
            className="flex items-center gap-1"
          >
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: statusFill[s] }}
            />
            {s}
          </motion.span>
        ))}
      </motion.div>
    </Card>
  )
}
