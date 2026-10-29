import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { MapPin, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
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

const MIN_ZOOM = 0.5
const DEFAULT_ZOOM = 1
const MAX_ZOOM = 4

type Point = { x: number; y: number }

const collator = new Intl.Collator(undefined, { numeric: true })

function shortLabel(plotNumber: string): string {
  const dash = plotNumber.indexOf("-")
  return dash === -1 ? plotNumber : plotNumber.slice(dash + 1)
}

/**
 * Mobile-first zoom/pan viewport for the family-facing site plan. Buttons and
 * pinch gestures scale the drawing between 0.5× and 4×, dragging pans it once
 * it is larger than the viewport, and a tap that isn't a drag still selects the
 * plot underneath.
 */
function ZoomablePlotMap({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 })
  const viewportRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(DEFAULT_ZOOM)
  const panRef = useRef<Point>({ x: 0, y: 0 })
  const pointers = useRef(new Map<number, Point>())
  const drag = useRef<{
    startX: number
    startY: number
    startPan: Point
    moved: boolean
  } | null>(null)
  const pinch = useRef<{
    startDistance: number
    startZoom: number
    startPan: Point
    focal: Point
  } | null>(null)
  const gestureMoved = useRef(false)
  const suppressClick = useRef(false)

  /** Keeps the drawing inside the viewport (centered when it is smaller). */
  const clampPan = useCallback((next: Point, nextZoom: number): Point => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content || !content.offsetWidth) return next
    const width = content.offsetWidth * nextZoom
    const height = content.offsetHeight * nextZoom
    const spareX = viewport.clientWidth - width
    const spareY = viewport.clientHeight - height
    return {
      x: spareX >= 0 ? spareX / 2 : Math.min(0, Math.max(spareX, next.x)),
      y: spareY >= 0 ? spareY / 2 : Math.min(0, Math.max(spareY, next.y)),
    }
  }, [])

  const commit = useCallback((nextZoom: number, nextPan: Point) => {
    zoomRef.current = nextZoom
    panRef.current = nextPan
    setZoom(nextZoom)
    setPan(nextPan)
  }, [])

  const zoomTo = useCallback(
    (nextZoom: number, focal?: Point) => {
      const current = zoomRef.current
      const target = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom))
      if (target === current) return
      const viewport = viewportRef.current
      const center = focal ?? {
        x: (viewport?.clientWidth ?? 0) / 2,
        y: (viewport?.clientHeight ?? 0) / 2,
      }
      const ratio = target / current
      const next = {
        x: center.x - (center.x - panRef.current.x) * ratio,
        y: center.y - (center.y - panRef.current.y) * ratio,
      }
      commit(target, clampPan(next, target))
    },
    [clampPan, commit]
  )

  const reset = useCallback(() => {
    commit(DEFAULT_ZOOM, clampPan({ x: 0, y: 0 }, DEFAULT_ZOOM))
  }, [clampPan, commit])

  // Center the map on mount and keep the pan valid after an orientation or
  // window-size change.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const observer = new ResizeObserver(() => {
      commit(zoomRef.current, clampPan(panRef.current, zoomRef.current))
    })
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [clampPan, commit])

  // Ctrl/⌘ + wheel (including trackpad pinch) zooms under the cursor. A plain
  // wheel keeps scrolling the page.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      const rect = viewport.getBoundingClientRect()
      zoomTo(zoomRef.current * Math.exp(-event.deltaY * 0.0015), {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }
    viewport.addEventListener("wheel", onWheel, { passive: false })
    return () => viewport.removeEventListener("wheel", onWheel)
  }, [zoomTo])

  function localPoint(event: ReactPointerEvent<HTMLDivElement>): Point {
    const rect = viewportRef.current?.getBoundingClientRect()
    return rect
      ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
      : { x: event.clientX, y: event.clientY }
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return
    // A drag can finish without the browser synthesizing a click. Clear any
    // suppression left from that gesture so this new tap starts fresh.
    suppressClick.current = false
    const point = localPoint(event)
    pointers.current.set(event.pointerId, point)

    if (pointers.current.size === 1) {
      gestureMoved.current = false
      drag.current = {
        startX: point.x,
        startY: point.y,
        startPan: panRef.current,
        moved: false,
      }
      pinch.current = null
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      pinch.current = {
        startDistance: Math.hypot(a.x - b.x, a.y - b.y),
        startZoom: zoomRef.current,
        startPan: panRef.current,
        focal: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      }
      drag.current = null
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return
    const point = localPoint(event)
    pointers.current.set(event.pointerId, point)

    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = Array.from(pointers.current.values())
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch.current.startDistance <= 0) return
      const targetZoom = Math.min(
        MAX_ZOOM,
        Math.max(
          MIN_ZOOM,
          pinch.current.startZoom * (distance / pinch.current.startDistance)
        )
      )
      const focal = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const ratio = targetZoom / pinch.current.startZoom
      commit(
        targetZoom,
        clampPan(
          {
            x:
              focal.x -
              (pinch.current.focal.x - pinch.current.startPan.x) * ratio,
            y:
              focal.y -
              (pinch.current.focal.y - pinch.current.startPan.y) * ratio,
          },
          targetZoom
        )
      )
      if (Math.abs(distance - pinch.current.startDistance) > 4) {
        gestureMoved.current = true
      }
      event.preventDefault()
      return
    }

    const current = drag.current
    if (!current) return
    const dx = point.x - current.startX
    const dy = point.y - current.startY
    if (Math.hypot(dx, dy) > 5) {
      current.moved = true
      gestureMoved.current = true
    }
    if (current.moved) {
      commit(
        zoomRef.current,
        clampPan(
          { x: current.startPan.x + dx, y: current.startPan.y + dy },
          zoomRef.current
        )
      )
      event.preventDefault()
    }
  }

  function handleClickCapture(event: ReactMouseEvent<HTMLDivElement>) {
    // Keyboard-activated clicks (detail 0) were never part of a drag.
    if (!suppressClick.current || event.detail === 0) return
    suppressClick.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  /**
   * Ends one pointer's gesture. Pointer-up normally bubbles through the map,
   * but a mouse drag can finish outside it, so a window listener below also
   * reports the release. The release point decides whether a click should be
   * suppressed, so an off-map release can never swallow the next tap.
   */
  const endPointer = useCallback(
    (pointerId: number, point?: { clientX: number; clientY: number }) => {
      if (!pointers.current.has(pointerId)) return
      pointers.current.delete(pointerId)
      if (pointers.current.size === 0) {
        const rect = viewportRef.current?.getBoundingClientRect()
        const inside =
          !!rect &&
          !!point &&
          point.clientX >= rect.left &&
          point.clientX <= rect.right &&
          point.clientY >= rect.top &&
          point.clientY <= rect.bottom
        suppressClick.current = inside && gestureMoved.current
        drag.current = null
        pinch.current = null
        gestureMoved.current = false
      } else if (pointers.current.size === 1) {
        // One finger lifted after a pinch: keep panning with the remaining one.
        const remaining = Array.from(pointers.current.values())[0]
        drag.current = {
          startX: remaining.x,
          startY: remaining.y,
          startPan: panRef.current,
          moved: true,
        }
        pinch.current = null
        gestureMoved.current = true
      }
    },
    []
  )

  useEffect(() => {
    const finish = (event: PointerEvent) => {
      if (!pointers.current.has(event.pointerId)) return
      endPointer(
        event.pointerId,
        event.type === "pointerup" ? event : undefined
      )
    }
    window.addEventListener("pointerup", finish)
    window.addEventListener("pointercancel", finish)
    return () => {
      window.removeEventListener("pointerup", finish)
      window.removeEventListener("pointercancel", finish)
    }
  }, [endPointer])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] text-deep/50">Pinch to zoom · drag to pan</p>
        <div className="flex items-center gap-0.5 rounded-full border border-deep/10 bg-white px-1 py-1 shadow-sm">
          <button
            type="button"
            onClick={() => zoomTo(zoom / 1.5)}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className="flex size-7 items-center justify-center rounded-full text-deep transition active:bg-cream disabled:opacity-30"
          >
            <ZoomOut size={15} />
          </button>
          <span className="min-w-9 text-center text-[10px] font-semibold text-deep/70">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomTo(zoom * 1.5)}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="flex size-7 items-center justify-center rounded-full text-deep transition active:bg-cream disabled:opacity-30"
          >
            <ZoomIn size={15} />
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset zoom"
            className="flex size-7 items-center justify-center rounded-full text-deep/60 transition active:bg-cream"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`relative h-[70vw] max-h-[420px] min-h-[260px] touch-none overflow-hidden rounded-xl bg-[#f8f6f0] select-none ${
          zoom > MIN_ZOOM ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => endPointer(event.pointerId, event)}
        onPointerCancel={(event) => endPointer(event.pointerId)}
        onClickCapture={handleClickCapture}
      >
        <div
          ref={contentRef}
          className="w-full origin-top-left will-change-transform"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
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
  const sections = [...new Set(cemeteryPlots.map((p) => p.section))]
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
      <ZoomablePlotMap key={cemetery}>
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
      </ZoomablePlotMap>

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
