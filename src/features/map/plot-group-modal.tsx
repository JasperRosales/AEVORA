import { useState, type FormEvent } from "react"
import { Modal } from "@/components/ui/modal"
import { updatePlotRows } from "@/data/store"
import { PLOT_CATEGORIES } from "@/lib/plot-category"
import { groupPlots } from "@/lib/neon-api"
import type { Plot, PlotCategory } from "@/types/domain"

const LABEL = "mb-1 block text-xs font-medium text-deep"
const INPUT =
  "w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
const PRIMARY =
  "rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
const GHOST = "neu-button px-4 py-2 text-sm"

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/** Groups the plots selected on the map and assigns their shared category. */
export function PlotGroupModal({
  plots,
  onClose,
  onGrouped,
}: {
  plots: Plot[]
  onClose: () => void
  onGrouped: (message: string) => void
}) {
  const [groupName, setGroupName] = useState(plots[0]?.groupName ?? "")
  const [category, setCategory] = useState<PlotCategory>(
    plots[0]?.type ?? "Typical Block"
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const grouped = plots.some((plot) => plot.groupName)

  async function saveGroup(event: FormEvent) {
    event.preventDefault()
    if (!groupName.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      const updated = await groupPlots(
        plots.map((plot) => plot.id),
        { groupName: groupName.trim(), type: category }
      )
      updatePlotRows(updated)
      onGrouped(
        `${updated.length} plot${updated.length === 1 ? "" : "s"} grouped as ${groupName.trim()}.`
      )
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  async function ungroup() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const updated = await groupPlots(
        plots.map((plot) => plot.id),
        { groupName: "" }
      )
      updatePlotRows(updated)
      onGrouped(
        `${updated.length} plot${updated.length === 1 ? "" : "s"} removed from their group.`
      )
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Group Selected Plots"
      description={`${plots.length} plot${plots.length === 1 ? "" : "s"} selected. The group is outlined on the map using its category color.`}
    >
      <form onSubmit={saveGroup} className="space-y-3">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div>
          <label className={LABEL} htmlFor="plot-group-name">
            Group name
          </label>
          <input
            id="plot-group-name"
            required
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Block A"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="plot-group-category">
            Type
          </label>
          <select
            id="plot-group-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as PlotCategory)}
            className={INPUT}
          >
            {PLOT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <div>
            {grouped && (
              <button
                type="button"
                onClick={() => void ungroup()}
                disabled={busy}
                className={GHOST}
              >
                Ungroup
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={GHOST}>
              Cancel
            </button>
            <button type="submit" disabled={busy} className={PRIMARY}>
              {busy ? "Saving..." : "Save Group"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
