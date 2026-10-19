import { Maximize, Minus, Plus } from "lucide-react"
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
const SECTION_COLS = 6
const SECTION_ROWS = 4
const SECTION_W = SECTION_COLS * (CELL + GAP) + GAP
const SECTION_H = SECTION_ROWS * (CELL + GAP) + GAP + 16
const SECTIONS = ["A", "B", "C", "D"]

/**
 * The interactive SVG plot map: four sections of grid cells with zoom
 * controls and a status legend. Plots outside the active filters dim to 15%.
 */
export function PlotMapCard({
  plots,
  cemeteryId,
  burialType,
  section,
  status,
  selected,
  onSelect,
}: {
  plots: Plot[]
  cemeteryId: string
  burialType: BurialType | "All"
  section: string
  status: PlotStatus | "All"
  selected: Plot | null
  onSelect: (plot: Plot) => void
}) {
  const [zoom, setZoom] = useState(1)

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
          width={SECTION_W * 2 + 60}
          height={SECTION_H * 2 + 40}
          className="bg-cream transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
        >
          <text x={20} y={20} className="fill-deep text-xs">
            Main Entrance
          </text>
          {SECTIONS.map((sec, i) => {
            const originX = 30 + (i % 2) * (SECTION_W + 40)
            const originY = 30 + Math.floor(i / 2) * (SECTION_H + 20)
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
                  x={originX - GAP}
                  y={originY}
                  width={SECTION_W}
                  height={SECTION_H - 14}
                  rx={6}
                  fill="#102B52"
                  opacity={0.08}
                />
                {plots
                  .filter(
                    (p) => p.cemeteryId === cemeteryId && p.section === sec
                  )
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
                        y={originY + 18 + (p.row - 1) * (CELL + GAP)}
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
