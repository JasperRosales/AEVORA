/**
 * Persistent storage and synchronization for cemetery plot layouts and positions.
 * Saves positions permanently in localStorage and dispatches cross-tab / cross-view
 * events so that updates from staff are immediately reflected in the client portal.
 */

const STORAGE_PREFIX = "aevora_plot_positions_"
const EVENT_NAME = "aevora-plot-positions-changed"

export interface Point {
  x: number
  y: number
}

export type PlotPositionsMap = Record<string, Point>

/**
 * Normalizes cemetery identifier to a consistent storage key.
 */
export function getStorageKey(cemeteryId?: string | null): string {
  const normalized = (cemeteryId || "default")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
  return `${STORAGE_PREFIX}${normalized}`
}

/**
 * Loads saved plot positions for a cemetery.
 */
export function loadPlotPositions(
  cemeteryId?: string | null
): PlotPositionsMap {
  if (typeof window === "undefined") return {}
  try {
    const key = getStorageKey(cemeteryId)
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object") {
        return parsed as PlotPositionsMap
      }
    }
  } catch (err) {
    console.warn("[plot-layout-storage] Failed to load plot positions:", err)
  }
  return {}
}

/**
 * Saves plot positions permanently and notifies all listening components.
 */
export function savePlotPositions(
  cemeteryId: string | null | undefined,
  positions: PlotPositionsMap
): void {
  if (typeof window === "undefined") return
  const key = getStorageKey(cemeteryId)
  try {
    localStorage.setItem(key, JSON.stringify(positions))
    // Also save under raw cemeteryId if different
    if (cemeteryId && cemeteryId !== getStorageKey(cemeteryId)) {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${cemeteryId}`, JSON.stringify(positions))
      } catch {}
    }
    // Dispatch custom event for real-time local sync across components
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { cemeteryId, positions },
      })
    )
  } catch (err) {
    console.error("[plot-layout-storage] Failed to save plot positions:", err)
  }
}

/**
 * Clears saved plot positions for a cemetery, reverting to default layout.
 */
export function clearPlotPositions(cemeteryId?: string | null): void {
  if (typeof window === "undefined") return
  const key = getStorageKey(cemeteryId)
  try {
    localStorage.removeItem(key)
    if (cemeteryId) {
      localStorage.removeItem(`${STORAGE_PREFIX}${cemeteryId}`)
    }
    window.dispatchEvent(
      new CustomEvent(EVENT_NAME, {
        detail: { cemeteryId, positions: {} },
      })
    )
  } catch (err) {
    console.error("[plot-layout-storage] Failed to clear plot positions:", err)
  }
}

/**
 * Subscribes to layout changes for a given cemetery.
 */
export function subscribePlotPositions(
  cemeteryId: string | null | undefined,
  onUpdate: (positions: PlotPositionsMap) => void
): () => void {
  if (typeof window === "undefined") return () => {}

  const key = getStorageKey(cemeteryId)

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<{
      cemeteryId?: string
      positions: PlotPositionsMap
    }>
    if (!custom.detail) {
      onUpdate(loadPlotPositions(cemeteryId))
      return
    }
    const eventKey = getStorageKey(custom.detail.cemeteryId)
    if (eventKey === key) {
      onUpdate(custom.detail.positions)
    }
  }

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === key) {
      onUpdate(loadPlotPositions(cemeteryId))
    }
  }

  window.addEventListener(EVENT_NAME, handleCustomEvent)
  window.addEventListener("storage", handleStorageEvent)

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent)
    window.removeEventListener("storage", handleStorageEvent)
  }
}

