import { useId, useMemo } from "react"
import { plotStatusFill } from "@/lib/status"
import type { BurialType, PlotStatus } from "@/types/domain"

/** One cell on the land map. The label is the short plot number (e.g. 101). */
export interface LandMapPlot {
  id: string
  label: string
  row: number
  column: number
  status: PlotStatus
  type: BurialType
}

/** A parcel of land containing a rectangular block of plots. */
export interface LandMapSection {
  name: string
  plots: LandMapPlot[]
}

const CELL = 20
const CELL_GAP = 3
const SECTION_PAD = 10
const SECTION_HEADER = 30
const SECTION_GAP = 18
const LAND_PAD = 28

interface MeasuredSection extends LandMapSection {
  columns: number
  rows: number
  width: number
  height: number
}

interface PositionedSection extends MeasuredSection {
  x: number
  y: number
}

function measure(section: LandMapSection): MeasuredSection {
  const columns = Math.max(1, ...section.plots.map((plot) => plot.column))
  const rows = Math.max(1, ...section.plots.map((plot) => plot.row))
  const gridWidth = columns * CELL + (columns - 1) * CELL_GAP
  const gridHeight = rows * CELL + (rows - 1) * CELL_GAP
  return {
    ...section,
    columns,
    rows,
    width: gridWidth + SECTION_PAD * 2,
    height: gridHeight + SECTION_HEADER + SECTION_PAD * 2,
  }
}

/**
 * Shelf layout: sections flow left-to-right in rows of `perRow`. Each parcel
 * keeps the proportions of its plot grid, so a 4×8 block is a wide rectangle,
 * a 6×6 block is a square, and a 10×10 block is a large square. The land
 * boundary grows around whatever is placed on it.
 */
function layout(sections: LandMapSection[], perRow: number) {
  const measured = sections.map(measure)
  const rows = Math.max(1, Math.ceil(measured.length / perRow))
  const positioned: PositionedSection[] = []
  let y = LAND_PAD
  let landWidth = 0

  for (let row = 0; row < rows; row++) {
    const rowSections = measured.slice(row * perRow, (row + 1) * perRow)
    let x = LAND_PAD
    let rowHeight = 0
    for (const section of rowSections) {
      positioned.push({ ...section, x, y })
      x += section.width + SECTION_GAP
      rowHeight = Math.max(rowHeight, section.height)
    }
    landWidth = Math.max(landWidth, x - SECTION_GAP + LAND_PAD)
    y += rowHeight + SECTION_GAP
  }

  return {
    sections: positioned,
    width: Math.max(320, landWidth),
    height: Math.max(220, y - SECTION_GAP + LAND_PAD),
  }
}

/**
 * The shared site-plan drawing used by the staff and client maps. It renders a
 * land boundary, a parcel per section, and one cell per plot. The caller
 * supplies selection, dimming and click behaviour so the same drawing can be a
 * read-only family view or an editable office view.
 */
export function PlotLandMap({
  sections,
  sectionColumns,
  selectedId,
  onSelect,
  onBackgroundClick,
  isDimmed,
  ariaLabel = "Cemetery plot map",
}: {
  sections: LandMapSection[]
  sectionColumns: number
  selectedId?: string | null
  onSelect?: (id: string) => void
  onBackgroundClick?: () => void
  isDimmed?: (plot: LandMapPlot) => boolean
  ariaLabel?: string
}) {
  const rawId = useId()
  const gridId = `land-grid-${rawId.replace(/:/g, "")}`
  const perRow = Math.max(1, Math.min(4, sectionColumns))
  const drawing = useMemo(() => layout(sections, perRow), [sections, perRow])

  if (sections.length === 0) return null

  return (
    <svg
      viewBox={`0 0 ${drawing.width} ${drawing.height}`}
      className="block h-auto w-full"
      style={{ aspectRatio: `${drawing.width} / ${drawing.height}` }}
      role="img"
      aria-label={ariaLabel}
      onClick={onBackgroundClick}
    >
      <defs>
        <pattern
          id={gridId}
          width={CELL * 2}
          height={CELL * 2}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${CELL * 2} 0 L 0 0 0 ${CELL * 2}`}
            fill="none"
            stroke="#102B52"
            strokeOpacity={0.06}
            strokeWidth={1}
          />
        </pattern>
      </defs>

      {/* Land */}
      <rect
        width={drawing.width}
        height={drawing.height}
        rx={14}
        fill="#E9E4D4"
      />
      <rect
        width={drawing.width}
        height={drawing.height}
        rx={14}
        fill={`url(#${gridId})`}
      />
      <rect
        width={drawing.width}
        height={drawing.height}
        rx={14}
        fill="none"
        stroke="#102B52"
        strokeOpacity={0.18}
        strokeWidth={1.5}
      />

      {/* North marker and entrance label give the drawing a site-plan feel. */}
      <g transform={`translate(${drawing.width - 22}, 12)`} opacity={0.45}>
        <path
          d="M0 10 L0 0 M-3 3 L0 0 L3 3"
          fill="none"
          stroke="#102B52"
          strokeWidth={1.2}
        />
        <text
          x={0}
          y={-2}
          textAnchor="middle"
          fill="#102B52"
          style={{ fontSize: 7, fontWeight: 600 }}
        >
          N
        </text>
      </g>
      <text
        x={drawing.width / 2}
        y={drawing.height - 9}
        textAnchor="middle"
        fill="#102B52"
        opacity={0.4}
        style={{ fontSize: 7, letterSpacing: 1 }}
      >
        MAIN ENTRANCE
      </text>

      {/* Sections and their plots */}
      {drawing.sections.map((section) => {
        const showLabels = section.columns <= 12 && section.rows <= 12
        const compact = section.width < 90
        const visible = section.plots.filter(
          (plot) => !(isDimmed?.(plot) ?? false)
        )
        const available = visible.filter(
          (plot) => plot.status === "Available"
        ).length
        const summary =
          visible.length === 0
            ? "No matching plots"
            : `${available} of ${visible.length} available`

        return (
          <g
            key={section.name}
            transform={`translate(${section.x}, ${section.y})`}
          >
            <rect
              width={section.width}
              height={section.height}
              rx={7}
              fill="#F7F5EC"
              stroke="#102B52"
              strokeOpacity={0.22}
              strokeWidth={1}
            />
            <text
              x={SECTION_PAD}
              y={SECTION_PAD + 11}
              fill="#102B52"
              style={{ fontSize: compact ? 7 : 10, fontWeight: 600 }}
            >
              Section {section.name}
            </text>
            {!compact && (
              <text
                x={section.width - SECTION_PAD}
                y={SECTION_PAD + 11}
                textAnchor="end"
                fill="#102B52"
                opacity={0.45}
                style={{ fontSize: 7 }}
              >
                {section.rows} × {section.columns}
              </text>
            )}
            {compact ? (
              <text
                x={SECTION_PAD}
                y={SECTION_PAD + 22}
                fill="#102B52"
                opacity={0.45}
                style={{ fontSize: 6 }}
              >
                {section.rows} × {section.columns}
              </text>
            ) : (
              <text
                x={SECTION_PAD}
                y={SECTION_PAD + 22}
                fill="#102B52"
                opacity={0.5}
                style={{ fontSize: 7 }}
              >
                {summary}
              </text>
            )}

            {section.plots.map((plot) => {
              const fill = plotStatusFill[plot.status]
              const selected = selectedId === plot.id
              const dimmed = isDimmed?.(plot) ?? false
              const darkText =
                plot.status === "Unavailable" ||
                plot.status === "Waiting for Checking"
              const px = SECTION_PAD + (plot.column - 1) * (CELL + CELL_GAP)
              const py =
                SECTION_PAD +
                SECTION_HEADER +
                (plot.row - 1) * (CELL + CELL_GAP)

              return (
                <g
                  key={plot.id}
                  opacity={selected ? 1 : dimmed ? 0.18 : 1}
                  className={onSelect ? "cursor-pointer" : undefined}
                  onClick={
                    onSelect
                      ? (event) => {
                          event.stopPropagation()
                          onSelect(plot.id)
                        }
                      : undefined
                  }
                >
                  <title>{`Plot ${section.name}-${plot.label} — ${plot.status}`}</title>
                  <rect
                    x={px}
                    y={py}
                    width={CELL}
                    height={CELL}
                    rx={2.5}
                    fill={fill.fill}
                    stroke={selected ? "#102B52" : (fill.stroke ?? "transparent")}
                    strokeWidth={selected ? 2.5 : 1}
                  />
                  {showLabels && (
                    <text
                      x={px + CELL / 2}
                      y={py + CELL / 2 + 3}
                      textAnchor="middle"
                      fill={darkText ? "#102B52" : "#F4F2E8"}
                      opacity={darkText ? 0.7 : 0.95}
                      pointerEvents="none"
                      style={{ fontSize: 8, fontWeight: 600 }}
                    >
                      {plot.label}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
