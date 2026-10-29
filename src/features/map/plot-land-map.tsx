import { useId, useMemo, useState, useRef } from "react"
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

export interface MapElement {
  id: string
  type: "road" | "wall" | "tree" | "structure"
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

const CELL = 18
const CELL_GAP = 2
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
 * Layout all plots in a single large unified grid.
 */
function layoutUnified(sections: LandMapSection[], customCols?: number) {
  const allPlots: LandMapPlot[] = []
  for (const section of sections) {
    allPlots.push(...section.plots)
  }

  if (allPlots.length === 0) {
    return { sections: [], width: 320, height: 220 }
  }

  // Use a fixed reasonable grid layout - 15 columns by default
  const cols = Math.max(1, Math.floor(customCols ?? 15))
  const rows = Math.ceil(allPlots.length / cols)

  const gridWidth = cols * CELL + (cols - 1) * CELL_GAP
  const gridHeight = rows * CELL + (rows - 1) * CELL_GAP

  const unifiedSection: PositionedSection = {
    name: "Plots",
    plots: allPlots,
    columns: cols,
    rows: rows,
    width: gridWidth + SECTION_PAD * 2,
    height: gridHeight + SECTION_HEADER + SECTION_PAD * 2,
    x: LAND_PAD,
    y: LAND_PAD,
  }

  return {
    sections: [unifiedSection],
    width: Math.max(320, unifiedSection.width + LAND_PAD * 2),
    height: Math.max(220, unifiedSection.height + LAND_PAD * 2),
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
  backgroundImage,
  draggable = false,
  onSectionMove,
  unified = true,
  customCols,
  plotDraggable = false,
  selectedPlots = new Set<string>(),
  mapElements = [] as MapElement[],
  onMapElementsChange,
  editMode = "plots" as "plots" | "roads" | "walls" | "trees",
}: {
  sections: LandMapSection[]
  sectionColumns: number
  selectedId?: string | null
  onSelect?: (id: string) => void
  onBackgroundClick?: () => void
  isDimmed?: (plot: LandMapPlot) => boolean
  ariaLabel?: string
  backgroundImage?: string | null
  draggable?: boolean
  onSectionMove?: (sectionName: string, x: number, y: number) => void
  unified?: boolean
  customCols?: number
  plotDraggable?: boolean
  selectedPlots?: Set<string>
  mapElements?: MapElement[]
  onMapElementsChange?: (elements: MapElement[]) => void
  editMode?: "plots" | "roads" | "walls" | "trees"
}) {
  const rawId = useId()
  const gridId = `land-grid-${rawId.replace(/:/g, "")}`
  const bgId = `bg-image-${rawId.replace(/:/g, "")}`
  const perRow = Math.max(1, Math.min(4, sectionColumns))
  const autoLayout = useMemo(
    () =>
      unified ? layoutUnified(sections, customCols) : layout(sections, perRow),
    [sections, perRow, unified, customCols]
  )

  // Manual positions for draggable elements
  const [manualPositions, setManualPositions] = useState<
    Record<string, { x: number; y: number }>
  >({})
  const [dragging, setDragging] = useState<string | null>(null)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [plotPositions, setPlotPositions] = useState<
    Record<string, { x: number; y: number }>
  >({})
  const [draggingPlot, setDraggingPlot] = useState<string | null>(null)
  const plotDragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [elements, setElements] = useState<MapElement[]>(() => {
    try {
      const saved = localStorage.getItem("aevora-map-elements")
      if (saved) return JSON.parse(saved)
    } catch {
      // localStorage can be unavailable in private or embedded contexts.
    }
    return mapElements
  })
  const [draggingElement, setDraggingElement] = useState<string | null>(null)
  const elementDragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [selectedElement, setSelectedElement] = useState<string | null>(null)

  // Merge auto layout with manual positions
  const drawing = useMemo(() => {
    const positioned = autoLayout.sections.map((section) => {
      const manual = manualPositions[section.name]
      if (manual && !plotDraggable) {
        return { ...section, x: manual.x, y: manual.y }
      }
      return section
    })
    // Recalculate bounds
    if (positioned.length === 0) {
      return {
        sections: positioned,
        width: autoLayout.width,
        height: autoLayout.height,
      }
    }
    let maxX = 0
    let maxY = 0
    for (const s of positioned) {
      if (s.x + s.width > maxX) maxX = s.x + s.width
      if (s.y + s.height > maxY) maxY = s.y + s.height
    }
    // Also consider plot positions
    for (const pos of Object.values(plotPositions)) {
      if (pos.x + CELL > maxX) maxX = pos.x + CELL
      if (pos.y + CELL > maxY) maxY = pos.y + CELL
    }
    // Consider elements
    for (const el of elements) {
      if (el.x + el.width > maxX) maxX = el.x + el.width
      if (el.y + el.height > maxY) maxY = el.y + el.height
    }
    return {
      sections: positioned,
      width: Math.max(autoLayout.width, maxX + LAND_PAD),
      height: Math.max(autoLayout.height, maxY + LAND_PAD),
    }
  }, [autoLayout, manualPositions, plotDraggable, plotPositions, elements])

  if (sections.length === 0) return null

  const handleMouseDown = (e: React.MouseEvent, sectionName: string) => {
    if (!draggable && !plotDraggable) return
    e.stopPropagation()
    const section = drawing.sections.find((s) => s.name === sectionName)
    if (!section) return
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    dragOffset.current = {
      x: svgP.x - section.x,
      y: svgP.y - section.y,
    }
    setDragging(sectionName)
  }

  const handleMouseDownPlot = (e: React.MouseEvent, plotId: string) => {
    if (!plotDraggable) return
    e.stopPropagation()
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    const currentPos = plotPositions[plotId] || { x: 0, y: 0 }
    plotDragOffset.current = {
      x: svgP.x - currentPos.x,
      y: svgP.y - currentPos.y,
    }
    setDraggingPlot(plotId)
  }

  const handleMouseDownElement = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation()
    setSelectedElement(elementId)
    const svg = (e.currentTarget as SVGGElement).ownerSVGElement
    if (!svg) return
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
    const el = elements.find((e) => e.id === elementId)
    if (!el) return
    elementDragOffset.current = {
      x: svgP.x - el.x,
      y: svgP.y - el.y,
    }
    setDraggingElement(elementId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const svg = e.currentTarget as SVGSVGElement
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())

    if ((draggable || plotDraggable) && dragging) {
      e.stopPropagation()
      const newX = svgP.x - dragOffset.current.x
      const newY = svgP.y - dragOffset.current.y
      setManualPositions((prev) => ({
        ...prev,
        [dragging]: { x: Math.max(0, newX), y: Math.max(0, newY) },
      }))
      return
    }

    if (plotDraggable && draggingPlot) {
      e.stopPropagation()
      const newX = svgP.x - plotDragOffset.current.x
      const newY = svgP.y - plotDragOffset.current.y
      setPlotPositions((prev) => ({
        ...prev,
        [draggingPlot]: { x: Math.max(0, newX), y: Math.max(0, newY) },
      }))
      return
    }

    if (draggingElement) {
      e.stopPropagation()
      const newX = svgP.x - elementDragOffset.current.x
      const newY = svgP.y - elementDragOffset.current.y
      setElements((prev) => {
        const updated = prev.map((el) =>
          el.id === draggingElement
            ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) }
            : el
        )
        try {
          localStorage.setItem("aevora-map-elements", JSON.stringify(updated))
        } catch {
          // localStorage can be unavailable in private or embedded contexts.
        }
        if (onMapElementsChange) onMapElementsChange(updated)
        return updated
      })
    }
  }

  const handleMouseUp = () => {
    if ((draggable || plotDraggable) && dragging) {
      const pos = manualPositions[dragging]
      if (pos && onSectionMove) {
        onSectionMove(dragging, pos.x, pos.y)
      }
      setDragging(null)
    }
    if (plotDraggable && draggingPlot) {
      setDraggingPlot(null)
    }
    if (draggingElement) {
      setDraggingElement(null)
    }
  }

  const removeElement = () => {
    if (!selectedElement) return
    const updated = elements.filter((el) => el.id !== selectedElement)
    setElements(updated)
    try {
      localStorage.setItem("aevora-map-elements", JSON.stringify(updated))
    } catch {
      // localStorage can be unavailable in private or embedded contexts.
    }
    if (onMapElementsChange) onMapElementsChange(updated)
    setSelectedElement(null)
  }

  const handleSvgClick = (e: React.MouseEvent) => {
    if (onBackgroundClick) onBackgroundClick()
    setSelectedElement(null)
    if (editMode !== "plots") {
      const svg = e.currentTarget as SVGSVGElement
      const pt = svg.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse())
      const newEl: MapElement = {
        id: `el-${Date.now()}`,
        type:
          editMode === "roads"
            ? "road"
            : editMode === "walls"
              ? "wall"
              : "tree",
        x: svgP.x,
        y: svgP.y,
        width: editMode === "roads" ? 60 : editMode === "walls" ? 4 : 16,
        height: editMode === "roads" ? 8 : editMode === "walls" ? 40 : 16,
      }
      const updated = [...elements, newEl]
      setElements(updated)
      try {
        localStorage.setItem("aevora-map-elements", JSON.stringify(updated))
      } catch {
        // localStorage can be unavailable in private or embedded contexts.
      }
      if (onMapElementsChange) onMapElementsChange(updated)
    }
  }

  return (
    <svg
      viewBox={`0 0 ${drawing.width} ${drawing.height}`}
      className="block h-auto w-full"
      style={{
        aspectRatio: `${drawing.width} / ${drawing.height}`,
        background: "#f8f6f0",
      }}
      role="img"
      aria-label={ariaLabel}
      onClick={handleSvgClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
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
        {backgroundImage && (
          <pattern
            id={bgId}
            patternUnits="userSpaceOnUse"
            width={drawing.width}
            height={drawing.height}
          >
            <image
              href={backgroundImage}
              width={drawing.width}
              height={drawing.height}
              preserveAspectRatio="xMidYMid meet"
            />
          </pattern>
        )}
      </defs>

      {/* Land / Background */}
      <rect width={drawing.width} height={drawing.height} fill="#f8f6f0" />
      {backgroundImage && (
        <rect
          width={drawing.width}
          height={drawing.height}
          fill={`url(#${bgId})`}
        />
      )}

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
        return (
          <g
            key={section.name}
            transform={`translate(${section.x}, ${section.y})`}
            onMouseDown={(e) => handleMouseDown(e, section.name)}
            style={{ cursor: draggable || plotDraggable ? "move" : "default" }}
          >
            <rect
              width={section.width}
              height={section.height}
              rx={7}
              fill="transparent"
              stroke="none"
              strokeWidth={0}
            />
            {unified && (
              <text
                x={section.width / 2}
                y={10}
                textAnchor="middle"
                fill="#102B52"
                opacity={0.3}
                style={{ fontSize: 8 }}
              >
                {section.rows} × {section.columns}
              </text>
            )}

            {section.plots.map((plot) => {
              const fill = plotStatusFill[plot.status]
              const selected =
                selectedId === plot.id || selectedPlots.has(plot.id)
              const dimmed = isDimmed?.(plot) ?? false
              const darkText =
                plot.status === "Unavailable" ||
                plot.status === "Waiting for Checking"
              const idx = section.plots.findIndex((p) => p.id === plot.id)
              const calcCol = idx % section.columns
              const calcRow = Math.floor(idx / section.columns)
              const basePx = SECTION_PAD + calcCol * (CELL + CELL_GAP)
              const basePy =
                SECTION_PAD + SECTION_HEADER + calcRow * (CELL + CELL_GAP)
              const customPos = plotPositions[plot.id]
              const px = customPos ? customPos.x : basePx
              const py = customPos ? customPos.y : basePy

              return (
                <g
                  key={plot.id}
                  opacity={selected ? 1 : dimmed ? 0.3 : 0.95}
                  className={
                    onSelect || plotDraggable ? "cursor-pointer" : undefined
                  }
                  onMouseDown={(e) => {
                    if (plotDraggable) {
                      handleMouseDownPlot(e, plot.id)
                    }
                  }}
                  onClick={
                    onSelect && !plotDraggable
                      ? (event) => {
                          event.stopPropagation()
                          onSelect(plot.id)
                        }
                      : plotDraggable && onSelect
                        ? (event) => {
                            event.stopPropagation()
                            onSelect(plot.id)
                          }
                        : undefined
                  }
                >
                  <title>{`Plot ${plot.label} — ${plot.status}`}</title>
                  <rect
                    x={px}
                    y={py}
                    width={CELL}
                    height={CELL}
                    rx={0.5}
                    fill={fill.fill}
                    stroke={selected ? "#000" : "#444"}
                    strokeWidth={selected ? 1.5 : 0.3}
                    opacity={dimmed ? 0.3 : 1}
                  />
                  <text
                    x={px + CELL / 2}
                    y={py + CELL / 2 + 0.8}
                    textAnchor="middle"
                    fill={darkText ? "#000" : "#fff"}
                    opacity={0.9}
                    pointerEvents="none"
                    style={{ fontSize: 3.2, fontWeight: 700 }}
                  >
                    {plot.label}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      {/* Map Elements (Roads, Walls, Trees) */}
      {elements.map((el) => (
        <g
          key={el.id}
          onMouseDown={(e) => handleMouseDownElement(e, el.id)}
          style={{ cursor: "move" }}
        >
          {el.type === "road" && (
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill="#8b7355"
              opacity={0.8}
              stroke={selectedElement === el.id ? "#000" : "none"}
              strokeWidth={selectedElement === el.id ? 1 : 0}
            />
          )}
          {el.type === "wall" && (
            <rect
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              fill="#4a4a4a"
              opacity={0.9}
              stroke={selectedElement === el.id ? "#000" : "none"}
              strokeWidth={selectedElement === el.id ? 1 : 0}
            />
          )}
          {el.type === "tree" && (
            <circle
              cx={el.x + el.width / 2}
              cy={el.y + el.height / 2}
              r={el.width / 2}
              fill="#2d5f3b"
              opacity={0.9}
              stroke={selectedElement === el.id ? "#000" : "none"}
              strokeWidth={selectedElement === el.id ? 1 : 0}
            />
          )}
        </g>
      ))}
      {selectedElement && (
        <foreignObject x={10} y={10} width={80} height={30}>
          <div>
            <button
              onClick={removeElement}
              style={{
                background: "#dc2626",
                color: "white",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "10px",
                cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        </foreignObject>
      )}
    </svg>
  )
}
