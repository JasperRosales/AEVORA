import { LayoutGrid } from "lucide-react"
import { useState, type FormEvent } from "react"
import { Modal } from "@/components/ui/modal"
import { insertPlots, useData } from "@/data/store"
import { createPlotGrid } from "@/lib/neon-api"
import type { BurialType, PlotStatus } from "@/types/domain"

const BURIAL_TYPES: BurialType[] = ["Private", "Vertical", "Public"]
const PLOT_STATUSES: PlotStatus[] = [
  "Available",
  "Waiting for Checking",
  "Unavailable",
]

const LABEL = "mb-1 block text-xs font-medium text-deep"
const INPUT =
  "w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
const PRIMARY =
  "rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
const GHOST = "neu-button px-4 py-2 text-sm"

const MAX_PLOTS = 500

function toInt(value: string): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : 0
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Bulk layout builder. Instead of adding one plot at a time, an admin describes
 * a rectangular block — one or more sections, rows × columns, a starting cell
 * and a shared type/size/price — and sees the resulting grid before committing.
 * Cells that already exist are skipped, so re-running a grid is safe and can be
 * used to fill an extension. Rendered only while open, so the form resets.
 */
export function PlotGridBuilderModal({
  cemeteryId,
  onClose,
  onCreated,
}: {
  cemeteryId: string
  onClose: () => void
  onCreated: (message: string) => void
}) {
  const { cemeteries, plots } = useData()
  const [cemetery, setCemetery] = useState(
    cemeteryId || cemeteries[0]?.id || ""
  )
  const [sections, setSections] = useState("A")
  const [rows, setRows] = useState("4")
  const [columns, setColumns] = useState("6")
  const [startRow, setStartRow] = useState("1")
  const [startColumn, setStartColumn] = useState("1")
  const [type, setType] = useState<BurialType>("Private")
  const [size, setSize] = useState("1.2m × 2.4m")
  const [price, setPrice] = useState("15000")
  const [status, setStatus] = useState<PlotStatus>("Available")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const parsedSections = [
    ...new Set(
      sections
        .split(",")
        .map((section) => section.trim().toUpperCase())
        .filter(Boolean)
    ),
  ]
  const rowCount = toInt(rows)
  const colCount = toInt(columns)
  const rowStart = toInt(startRow)
  const colStart = toInt(startColumn)
  const total = parsedSections.length * rowCount * colCount

  const validSections =
    parsedSections.length > 0 &&
    parsedSections.length <= 12 &&
    parsedSections.every((section) => /^[A-Z0-9]{1,3}$/.test(section))
  const validDims =
    rowCount >= 1 &&
    rowCount <= 50 &&
    colCount >= 1 &&
    colCount <= 50 &&
    rowStart >= 1 &&
    colStart >= 1 &&
    // Two-digit column numbers keep plot numbers unambiguous (A-101).
    colStart + colCount - 1 <= 99
  const tooMany = total > MAX_PLOTS
  const overLimit = tooMany ? total : 0

  const existingIds = new Set(
    plots.filter((p) => p.cemeteryId === cemetery).map((p) => p.id)
  )
  // Only materialise the cells when the request is within the cap; a 30,000
  // cell preview would be pointless (and the server rejects it anyway).
  const candidates =
    validSections && validDims && total > 0 && !tooMany
      ? parsedSections.flatMap((section) =>
          Array.from({ length: rowCount }).flatMap((_, r) =>
            Array.from({ length: colCount }).map((_, col) => {
              const row = rowStart + r
              const column = colStart + col
              return {
                id: `${cemetery}-${section}-${row}-${column}`,
                plotNumber: `${section}-${row}${String(column).padStart(2, "0")}`,
                section,
                row,
                column,
              }
            })
          )
        )
      : []
  const existingCount = candidates.filter((cell) =>
    existingIds.has(cell.id)
  ).length
  const freshCount = candidates.length - existingCount
  const nothingNew = candidates.length > 0 && freshCount === 0
  const valid =
    Boolean(cemetery) &&
    validSections &&
    validDims &&
    !tooMany &&
    !nothingNew &&
    size.trim().length > 0 &&
    Number(price) >= 0

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!valid) return
    setBusy(true)
    setError(null)
    try {
      const result = await createPlotGrid({
        cemeteryId: cemetery,
        sections: parsedSections,
        rows: rowCount,
        columns: colCount,
        startRow: rowStart,
        startColumn: colStart,
        type,
        size: size.trim(),
        price: Number(price),
        status,
      })
      insertPlots(result.created)
      const name =
        cemeteries.find((c) => c.id === cemetery)?.name ?? "the cemetery"
      const created = `${result.created.length} plot${
        result.created.length === 1 ? "" : "s"
      } created in ${name}`
      const skipped =
        result.skipped > 0
          ? ` · ${result.skipped} existing cell${
              result.skipped === 1 ? "" : "s"
            } skipped`
          : ""
      onCreated(created + skipped)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Build Plot Grid"
      description="Lay out a block of plots in a cemetery. Existing cells are skipped, so you can extend a grid safely."
    >
      <form onSubmit={submit} className="space-y-3">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="grid-cemetery">
              Cemetery
            </label>
            <select
              id="grid-cemetery"
              required
              value={cemetery}
              onChange={(e) => setCemetery(e.target.value)}
              className={INPUT}
            >
              <option value="">Select cemetery...</option>
              {cemeteries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="grid-sections">
              Sections
            </label>
            <input
              id="grid-sections"
              required
              value={sections}
              onChange={(e) => setSections(e.target.value)}
              placeholder="A, B, C"
              className={INPUT}
            />
            <p className="mt-1 text-[11px] text-deep/50">
              Comma-separated. Each section gets the same block.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={LABEL} htmlFor="grid-rows">
              Rows
            </label>
            <input
              id="grid-rows"
              type="number"
              min={1}
              max={50}
              required
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="grid-columns">
              Columns
            </label>
            <input
              id="grid-columns"
              type="number"
              min={1}
              max={50}
              required
              value={columns}
              onChange={(e) => setColumns(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="grid-start-row">
              Start row
            </label>
            <input
              id="grid-start-row"
              type="number"
              min={1}
              required
              value={startRow}
              onChange={(e) => setStartRow(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="grid-start-column">
              Start column
            </label>
            <input
              id="grid-start-column"
              type="number"
              min={1}
              max={99}
              required
              value={startColumn}
              onChange={(e) => setStartColumn(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={LABEL} htmlFor="grid-type">
              Type
            </label>
            <select
              id="grid-type"
              value={type}
              onChange={(e) => setType(e.target.value as BurialType)}
              className={INPUT}
            >
              {BURIAL_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="grid-status">
              Status
            </label>
            <select
              id="grid-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as PlotStatus)}
              className={INPUT}
            >
              {PLOT_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="grid-size">
              Size
            </label>
            <input
              id="grid-size"
              required
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="1.2m × 2.4m"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="grid-price">
              Price (₱)
            </label>
            <input
              id="grid-price"
              type="number"
              min={0}
              step={1}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={INPUT}
            />
          </div>
        </div>

        {tooMany ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            That grid is {overLimit} plots — the limit is {MAX_PLOTS} per
            request. Split it into smaller blocks.
          </p>
        ) : candidates.length > 0 ? (
          <div className="rounded-xl border border-deep/15 bg-cream/50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-deep">
                <LayoutGrid size={13} /> Preview
              </span>
              <span className="text-deep/60">
                {freshCount} new
                {existingCount > 0 ? ` · ${existingCount} existing` : ""}
              </span>
            </div>
            <div className="max-h-48 space-y-2 overflow-auto pr-1">
              {parsedSections.map((section) => {
                const cells = candidates.filter(
                  (cell) => cell.section === section
                )
                return (
                  <div key={section}>
                    <p className="mb-1 text-[10px] font-semibold tracking-wide text-deep/60 uppercase">
                      Section {section} · rows {rowStart}–
                      {rowStart + rowCount - 1} · columns {colStart}–
                      {colStart + colCount - 1}
                    </p>
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                        // Keep a narrow preview (e.g. one column) compact.
                        maxWidth: `${colCount * 28}px`,
                      }}
                    >
                      {cells.map((cell) => {
                        const exists = existingIds.has(cell.id)
                        return (
                          <span
                            key={cell.id}
                            title={`${cell.plotNumber}${
                              exists ? " · already exists" : ""
                            }`}
                            className={`aspect-square rounded-[2px] ${
                              exists ? "bg-deep/15" : "bg-teal/70"
                            }`}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            {nothingNew && (
              <p className="mt-2 text-[11px] text-amber-700">
                Every cell in this block already exists. Nothing new to create.
              </p>
            )}
          </div>
        ) : (
          <p className="rounded-lg bg-cream px-3 py-2 text-xs text-deep/60">
            Enter sections and a rows × columns block to preview the grid.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-deep/60">
            {total > 0 && !tooMany
              ? `${total} cell${total === 1 ? "" : "s"} in this block`
              : " "}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={GHOST}>
              Cancel
            </button>
            <button type="submit" disabled={busy || !valid} className={PRIMARY}>
              {busy
                ? "Creating..."
                : nothingNew
                  ? "Nothing to create"
                  : `Create ${freshCount || total} plot${
                      (freshCount || total) === 1 ? "" : "s"
                    }`}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
