import { useId, useMemo, useState, useRef } from "react"
import { plotCategoryStroke } from "@/lib/plot-category"
import { plotStatusFill } from "@/lib/status"
import type { PlotCategory, PlotStatus } from "@/types/domain"

/** One cell on the land map. The label is the short plot number (e.g. 101). */
export interface LandMapPlot {
  id: string
  label: string
  row: number
  column: number
  status: PlotStatus
  category?: PlotCategory
  groupName?: string
  /** Explicit cell position, used to keep grouped plots in their grid shape. */
  x?: number
  y?: number
}

/** A parcel of land containing a rectangular block of plots. */
export interface LandMapSection {
  name: string
  plots: LandMapPlot[]
  gridRows?: number
  gridColumns?: number
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
const GROUP_PAD = 1.8

function plotPosition(
  section: { columns: number },
  plot: LandMapPlot,
  index: number,
  positions: Record<string, { x: number; y: number }>
) {
  const calcCol = index % section.columns
  const calcRow = Math.floor(index / section.columns)
  const baseX = SECTION_PAD + calcCol * (CELL + CELL_GAP)
  const baseY = SECTION_PAD + SECTION_HEADER + calcRow * (CELL + CELL_GAP)
  const custom = positions[plot.id]
  if (custom) return { x: custom.x, y: custom.y }
  if (plot.x !== undefined && plot.y !== undefined) {
    return { x: plot.x, y: plot.y }
  }
  return { x: baseX, y: baseY }
}

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
  const placeholder = sections[0]
  if (
    sections.length === 1 &&
    placeholder.gridRows &&
    placeholder.gridColumns
  ) {
    const positioned = placeholder.plots.map((plot) => ({
      ...plot,
      x: SECTION_PAD + (plot.column - 1) * (CELL + CELL_GAP),
      y: SECTION_PAD + SECTION_HEADER + (plot.row - 1) * (CELL + CELL_GAP),
    }))
    const gridWidth =
      placeholder.gridColumns * CELL + (placeholder.gridColumns - 1) * CELL_GAP
    const gridHeight =
      placeholder.gridRows * CELL + (placeholder.gridRows - 1) * CELL_GAP
    const section: PositionedSection = {
      name: placeholder.name,
      plots: positioned,
      gridRows: placeholder.gridRows,
      gridColumns: placeholder.gridColumns,
      rows: placeholder.gridRows,
      columns: placeholder.gridColumns,
      width: gridWidth + SECTION_PAD * 2,
      height: gridHeight + SECTION_HEADER + SECTION_PAD * 2,
      x: LAND_PAD,
      y: LAND_PAD,
    }
    return {
      sections: [section],
      width: Math.max(320, section.width + LAND_PAD * 2),
      height: Math.max(220, section.height + LAND_PAD * 2),
    }
  }

  const ordered: Array<{ sectionName: string; plot: LandMapPlot }> = []
  for (const section of sections) {
    for (const plot of section.plots) {
      ordered.push({ sectionName: section.name, plot })
    }
  }

  if (ordered.length === 0) {
    return { sections: [], width: 320, height: 220 }
  }

  // Use a fixed reasonable grid layout - 15 columns by default
  const cols = Math.max(1, Math.floor(customCols ?? 15))
  const placed = new Set<string>()
  const positioned: LandMapPlot[] = []
  let cursorColumn = 0
  let cursorRow = 0
  let usedColumns = 1
  let usedRows = 1

  const place = (plot: LandMapPlot, column: number, row: number) => {
    positioned.push({
      ...plot,
      x: SECTION_PAD + column * (CELL + CELL_GAP),
      y: SECTION_PAD + SECTION_HEADER + row * (CELL + CELL_GAP),
    })
    placed.add(plot.id)
    usedColumns = Math.max(usedColumns, column + 1)
    usedRows = Math.max(usedRows, row + 1)
  }

  const advance = () => {
    cursorColumn += 1
    if (cursorColumn >= cols) {
      cursorColumn = 0
      cursorRow += 1
    }
  }

  for (const entry of ordered) {
    const plot = entry.plot
    if (placed.has(plot.id)) continue

    if (!plot.groupName) {
      place(plot, cursorColumn, cursorRow)
      advance()
      continue
    }

    // Keep the members of one group together as a block so the group outline
    // wraps a real grid instead of a scattered set of cells.
    const members = ordered
      .filter(
        (candidate) =>
          !placed.has(candidate.plot.id) &&
          candidate.sectionName === entry.sectionName &&
          candidate.plot.groupName === plot.groupName
      )
      .map((candidate) => candidate.plot)

    const baseRow = Math.min(...members.map((member) => member.row))
    const baseColumn = Math.min(...members.map((member) => member.column))
    let groupColumns =
      Math.max(...members.map((member) => member.column)) - baseColumn + 1
    let groupRows =
      Math.max(...members.map((member) => member.row)) - baseRow + 1

    // Legacy groups (or very lopsided grids) can have a huge bounding box with
    // few members; fall back to a compact near-square block.
    const sparse = groupColumns * groupRows > members.length * 3
    if (sparse) {
      groupColumns = Math.max(1, Math.ceil(Math.sqrt(members.length)))
      groupRows = Math.ceil(members.length / groupColumns)
    }

    if (cursorColumn + groupColumns > cols && cursorColumn > 0) {
      cursorColumn = 0
      cursorRow += 1
    }

    members.forEach((member, index) => {
      let offsetColumn = member.column - baseColumn
      let offsetRow = member.row - baseRow
      if (
        offsetColumn < 0 ||
        offsetColumn >= groupColumns ||
        offsetRow < 0 ||
        offsetRow >= groupRows
      ) {
        offsetColumn = index % groupColumns
        offsetRow = Math.floor(index / groupColumns)
      }
      place(member, cursorColumn + offsetColumn, cursorRow + offsetRow)
    })

    cursorColumn = 0
    cursorRow += groupRows
  }

  const gridWidth =
    usedColumns * CELL + (usedColumns - 1) * CELL_GAP + SECTION_PAD * 2
  const gridHeight =
    usedRows * CELL +
    (usedRows - 1) * CELL_GAP +
    SECTION_HEADER +
    SECTION_PAD * 2

  const unifiedSection: PositionedSection = {
    name: "Plots",
    plots: positioned,
    columns: usedColumns,
    rows: usedRows,
    width: gridWidth,
    height: gridHeight,
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
  onSelect?: (id: string, event: React.MouseEvent) => void
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

  const groupBoxes = (() => {
    const boxes = new Map<
      string,
      {
        sectionName: string
        label: string
        x: number
        y: number
        width: number
        height: number
        count: number
        stroke: string
      }
    >()
    for (const section of drawing.sections) {
      section.plots.forEach((plot, index) => {
        if (!plot.groupName) return
        const { x, y } = plotPosition(section, plot, index, plotPositions)
        const key = `${section.name}\u0000${plot.groupName}`
        const existing = boxes.get(key)
        const right = x + CELL + GROUP_PAD
        const bottom = y + CELL + GROUP_PAD
        if (!existing) {
          boxes.set(key, {
            sectionName: section.name,
            label: plot.groupName,
            x: x - GROUP_PAD,
            y: y - GROUP_PAD,
            width: CELL + GROUP_PAD * 2,
            height: CELL + GROUP_PAD * 2,
            count: 1,
            stroke: plotCategoryStroke[plot.category ?? "Typical Block"],
          })
          return
        }
        existing.count += 1
        const left = Math.min(existing.x, x - GROUP_PAD)
        const top = Math.min(existing.y, y - GROUP_PAD)
        const rightEdge = Math.max(existing.x + existing.width, right)
        const bottomEdge = Math.max(existing.y + existing.height, bottom)
        existing.x = left
        existing.y = top
        existing.width = rightEdge - left
        existing.height = bottomEdge - top
      })
    }
    return [...boxes.values()]
  })()

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

            {section.gridRows && section.gridColumns && (
              <g pointerEvents="none">
                {Array.from(
                  { length: section.gridRows * section.gridColumns },
                  (_, index) => {
                    const row = Math.floor(index / section.gridColumns!) + 1
                    const column = (index % section.gridColumns!) + 1
                    return (
                      <rect
                        key={`placeholder-${row}-${column}`}
                        x={SECTION_PAD + (column - 1) * (CELL + CELL_GAP)}
                        y={
                          SECTION_PAD +
                          SECTION_HEADER +
                          (row - 1) * (CELL + CELL_GAP)
                        }
                        width={CELL}
                        height={CELL}
                        rx={0.5}
                        fill="#ffffff"
                        fillOpacity={0.45}
                        stroke="#102B52"
                        strokeOpacity={0.18}
                        strokeWidth={0.5}
                        strokeDasharray="1 1"
                      />
                    )
                  }
                )}
              </g>
            )}

            {groupBoxes
              .filter((box) => box.sectionName === section.name)
              .map((box) => (
                <g
                  key={`group-card-${section.name}-${box.label}`}
                  pointerEvents="none"
                >
                  <title>{`${box.label} — ${box.count} plots`}</title>
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    rx={3.5}
                    fill={box.stroke}
                    fillOpacity={0.08}
                    stroke={box.stroke}
                    strokeWidth={2}
                    strokeDasharray="5 2"
                  />
                  <rect
                    x={box.x}
                    y={box.y}
                    width={box.width}
                    height={box.height}
                    rx={3.5}
                    fill="none"
                    stroke={box.stroke}
                    strokeOpacity={0.35}
                    strokeWidth={4}
                  />
                </g>
              ))}

            {section.plots.map((plot) => {
              const fill = plotStatusFill[plot.status]
              const typeColor =
                plotCategoryStroke[plot.category ?? "Typical Block"]
              const statusColor = fill.stroke ?? fill.fill
              const selected =
                selectedId === plot.id || selectedPlots.has(plot.id)
              const dimmed = isDimmed?.(plot) ?? false
              const darkText = plot.category === "Typical Block"
              const idx = section.plots.findIndex((p) => p.id === plot.id)
              const { x: px, y: py } = plotPosition(
                section,
                plot,
                idx,
                plotPositions
              )

              return (
                <g
                  key={plot.id}
                  opacity={selected || !dimmed ? 1 : 0.3}
                  className={
                    onSelect || plotDraggable ? "cursor-pointer" : undefined
                  }
                  onMouseDown={(e) => {
                    if (plotDraggable) {
                      handleMouseDownPlot(e, plot.id)
                    }
                  }}
                  onClick={
                    onSelect
                      ? (event) => {
                          event.stopPropagation()
                          onSelect(plot.id, event)
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
                    fill={typeColor}
                    stroke={selected ? "#000" : "#444"}
                    strokeWidth={selected ? 1.5 : 0.3}
                  />
                  <circle
                    cx={px + CELL - 2.7}
                    cy={py + 2.7}
                    r={2.1}
                    fill={statusColor}
                    stroke="#fff"
                    strokeWidth={0.65}
                  >
                    <title>{plot.status}</title>
                  </circle>
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

            {groupBoxes
              .filter((box) => box.sectionName === section.name)
              .map((box) => {
                const badgeWidth = Math.max(
                  14,
                  (box.label.length + String(box.count).length + 3) * 1.75
                )
                return (
                  <g
                    key={`${box.sectionName}-${box.label}`}
                    pointerEvents="none"
                  >
                    <rect
                      x={box.x}
                      y={box.y - 5.5}
                      width={badgeWidth}
                      height={4.6}
                      rx={1.4}
                      fill={box.stroke}
                    />
                    <text
                      x={box.x + 1.8}
                      y={box.y - 2.2}
                      fill="#fff"
                      style={{ fontSize: 3, fontWeight: 700 }}
                    >
                      {box.label} · {box.count}
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
