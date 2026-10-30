import {
  CalendarCheck,
  LayoutGrid,
  List,
  MapPin,
  RefreshCw,
  Upload,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { motion } from "motion/react"
import { Modal } from "@/components/ui/modal"
import { reloadClientData, useClientData } from "@/data/client-store"
import {
  createClientReservation,
  fetchClientMapPlaceholder,
  type ClientMapPlaceholder,
  type ClientPlot,
  type ClientReservation,
} from "@/lib/client-api"
import { EASE_OUT, stagger, staggerItem } from "@/lib/motion"
import { uploadAttachment } from "@/lib/neon-api"
import { PLOT_CATEGORIES } from "@/lib/plot-category"
import { ClientPlotDetailsSheet, ClientPlotMap } from "./client-plot-map"
import { PaymentSheet } from "./client-payment-sheet"
import type { PlotCategory } from "@/types/domain"
import { Card, ErrorNote, pesos, Spinner } from "./client-ui"

const LABEL =
  "mb-1 block text-[11px] font-semibold tracking-wide text-deep/60 uppercase"
const INPUT =
  "w-full rounded-xl border border-deep/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"

/** Cards rendered per "Show more" step — the register can hold hundreds. */
const PAGE_SIZE = 8

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * "Find a plot" tab — the buying journey starts here. The map shows the same
 * grid the office laid out (all statuses, only Available plots selectable);
 * the list is the quick catalogue of what can be bought right now. Picking a
 * plot holds it and opens the payment sheet straight after.
 */
export function PlotsTab({
  onOpenReservations,
  onOpenPayments,
}: {
  onOpenReservations: () => void
  onOpenPayments: () => void
}) {
  const { status, plots, summary, error } = useClientData()
  // Open on the first cemetery that has a plot to show, so the map is visible
  // immediately. The tab is mounted after the portal data has loaded, so this
  // initialiser sees the real catalogue.
  const [cemetery, setCemetery] = useState(() => {
    const mtZion = plots.find((plot) => plot.cemetery_id === "mt-zion")
    if (mtZion) return mtZion.cemetery
    const namedMtZion = plots.find((plot) =>
      plot.cemetery.toLowerCase().includes("mt. zion")
    )
    if (namedMtZion) return namedMtZion.cemetery
    const first = plots.find((p) => p.status === "Available") ?? plots[0]
    return first?.cemetery ?? "All"
  })
  const [category, setCategory] = useState<PlotCategory | "All">("All")
  const [view, setView] = useState<"map" | "list">("map")
  const [shown, setShown] = useState(PAGE_SIZE)
  const [details, setDetails] = useState<ClientPlot | null>(null)
  const [selected, setSelected] = useState<ClientPlot | null>(null)
  const [paying, setPaying] = useState<ClientReservation | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [mapLayoutState, setMapLayoutState] = useState<{
    cemeteryId: string
    status: "ready" | "error"
    layout?: ClientMapPlaceholder
    error?: string
  } | null>(null)

  const cemeteries = useMemo(
    () => Array.from(new Set(plots.map((p) => p.cemetery))).sort(),
    [plots]
  )
  const mapCemeteryId =
    cemetery === "All"
      ? null
      : (plots.find((plot) => plot.cemetery === cemetery)?.cemetery_id ?? null)

  useEffect(() => {
    if (view !== "map" || !mapCemeteryId) return
    let active = true
    fetchClientMapPlaceholder(mapCemeteryId)
      .then((layout) => {
        if (active) {
          setMapLayoutState({
            cemeteryId: mapCemeteryId,
            status: "ready",
            layout,
          })
        }
      })
      .catch((err) => {
        if (active) {
          setMapLayoutState({
            cemeteryId: mapCemeteryId,
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          })
        }
      })
    return () => {
      active = false
    }
  }, [mapCemeteryId, view])

  const availablePlots = useMemo(
    () => plots.filter((p) => p.status === "Available"),
    [plots]
  )
  const filtered = useMemo(
    () =>
      availablePlots.filter(
        (p) =>
          (cemetery === "All" || p.cemetery === cemetery) &&
          (category === "All" || p.type === category)
      ),
    [availablePlots, cemetery, category]
  )
  const visible = filtered.slice(0, shown)

  const mapPlots = plots.filter(
    (p) =>
      (cemetery === "All" || p.cemetery === cemetery) &&
      (category === "All" || p.type === category)
  )
  const mapAvailable = mapPlots.filter((p) => p.status === "Available").length
  const mapTotal = mapPlots.length

  if (status === "loading" || status === "idle") return <Spinner />
  if (status === "error")
    return <ErrorNote message={error ?? "Something went wrong."} />

  if (!summary?.client) {
    return (
      <Card>
        <p className="text-sm">
          Your account is not linked to a cemetery record yet, so plots cannot
          be reserved. Please visit the office or contact support to get
          registered.
        </p>
      </Card>
    )
  }

  function switchView(next: "map" | "list") {
    setView(next)
    // The map is per cemetery; "All cemeteries" has no single grid. Default to
    // the first cemetery that still has something to buy.
    if (next === "map" && cemetery === "All") {
      const first =
        cemeteries.find((name) =>
          plots.some((p) => p.cemetery === name && p.status === "Available")
        ) ?? cemeteries[0]
      if (first) setCemetery(first)
    }
  }

  // After a successful booking, close the sheet, refresh portal data (the
  // plot drops out of the available list) and move straight to payment.
  function onReserved(reservation: ClientReservation) {
    setSelected(null)
    setNotice(
      `Reservation ${reservation.reservation_number} created — plot ${reservation.plot_number} is held for you.`
    )
    setPaying(reservation)
  }

  return (
    <motion.div
      variants={stagger(0.06, 0.02)}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="rounded-xl bg-teal/20 px-3 py-2.5 text-xs text-deep"
        >
          <p className="font-medium">{notice}</p>
          <button
            onClick={onOpenReservations}
            className="mt-1 font-semibold text-navy underline-offset-2 hover:underline"
          >
            View my reservations
          </button>
        </motion.div>
      )}

      <Card>
        <p className="text-sm font-semibold">Choose your plot</p>
        <p className="mt-1 text-xs text-deep/60">
          Tap a cell on the map to see the plot, or switch to the list for what
          is available. Reserving holds a plot while the office verifies the
          details — you can pay the reservation fee right after.
        </p>
      </Card>

      <div className="flex gap-2">
        <select
          aria-label="Filter by cemetery"
          value={cemetery}
          onChange={(e) => {
            setCemetery(e.target.value)
            setDetails(null)
            setShown(PAGE_SIZE)
          }}
          className={INPUT}
        >
          <option value="All">All cemeteries</option>
          {cemeteries.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by plot category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as PlotCategory | "All")
            setShown(PAGE_SIZE)
          }}
          className={INPUT}
        >
          <option value="All">All categories</option>
          {PLOT_CATEGORIES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex rounded-xl border border-deep/15 bg-white p-0.5">
          {(["map", "list"] as const).map((option) => (
            <button
              key={option}
              onClick={() => switchView(option)}
              aria-pressed={view === option}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                view === option
                  ? "bg-navy text-cream"
                  : "bg-white text-deep/65 hover:text-deep"
              }`}
            >
              {option === "map" ? <LayoutGrid size={13} /> : <List size={13} />}
              {option === "map" ? "Map" : "List"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <p className="text-[11px] text-deep/50">
            {view === "map"
              ? cemetery === "All"
                ? "Choose a cemetery"
                : `${mapAvailable} of ${mapTotal} available`
              : `${filtered.length} ${
                  filtered.length === 1 ? "plot" : "plots"
                } available`}
          </p>
          <button
            onClick={() => reloadClientData()}
            aria-label="Refresh plots"
            className="flex size-8 items-center justify-center rounded-lg text-deep/60 transition-colors hover:bg-cream active:bg-cream/70"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {view === "map" ? (
        cemetery === "All" ? (
          <Card>
            <p className="text-sm font-semibold">Choose a cemetery</p>
            <p className="mt-1 text-xs text-deep/60">
              Each cemetery has its own plot layout.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cemeteries.map((name) => (
                <button
                  key={name}
                  onClick={() => setCemetery(name)}
                  className="neu-button px-3 py-2 text-xs font-medium text-deep"
                >
                  {name}
                </button>
              ))}
            </div>
          </Card>
        ) : mapLayoutState?.cemeteryId !== mapCemeteryId || !mapLayoutState ? (
          <Card>
            <p className="text-sm text-deep/60">Loading cemetery map…</p>
          </Card>
        ) : mapLayoutState.status === "error" ? (
          <Card>
            <p className="text-sm text-red-700">
              Could not load the saved cemetery map: {mapLayoutState.error}
            </p>
          </Card>
        ) : (
          <ClientPlotMap
            plots={plots}
            cemetery={cemetery}
            category={category}
            mapPlaceholder={mapLayoutState.layout ?? null}
            onSelect={setDetails}
          />
        )
      ) : filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-deep/70">
            No plots match these filters. Try another cemetery or plot category.
          </p>
          <button
            onClick={() => {
              setCemetery("All")
              setCategory("All")
              setShown(PAGE_SIZE)
            }}
            className="mt-2 text-xs font-semibold text-navy underline-offset-2 hover:underline"
          >
            Clear filters
          </button>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map((plot) => (
              <motion.article
                key={plot.id}
                variants={staggerItem}
                className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(12,44,85,0.07)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">Plot {plot.plot_number}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-deep/60">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">
                        {plot.cemetery} — {plot.location}
                      </span>
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-bold text-navy">
                    {pesos(plot.price)}
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-deep/70">
                  <span className="rounded-full bg-cream px-2 py-0.5">
                    Section {plot.section}
                  </span>
                  <span className="rounded-full bg-cream px-2 py-0.5">
                    {plot.type}
                  </span>
                  <span className="rounded-full bg-cream px-2 py-0.5">
                    {plot.size}
                  </span>
                </div>

                <motion.button
                  onClick={() => setSelected(plot)}
                  whileTap={{ scale: 0.98 }}
                  className="client-primary-button mt-3 w-full py-2.5 text-sm font-semibold"
                >
                  Reserve this plot
                </motion.button>
              </motion.article>
            ))}
          </div>

          {filtered.length > visible.length && (
            <motion.button
              onClick={() => setShown((n) => n + PAGE_SIZE)}
              whileTap={{ scale: 0.98 }}
              className="neu-button w-full py-2.5 text-xs font-semibold text-deep"
            >
              Show more plots ({filtered.length - visible.length} left)
            </motion.button>
          )}
        </>
      )}

      {details && (
        <ClientPlotDetailsSheet
          plot={details}
          onClose={() => setDetails(null)}
          onReserve={(plot) => {
            setDetails(null)
            setSelected(plot)
          }}
        />
      )}

      {selected && (
        <ReservePlotSheet
          plot={selected}
          onClose={() => setSelected(null)}
          onReserved={onReserved}
        />
      )}

      {paying && (
        <PaymentSheet
          reservation={paying}
          onClose={() => setPaying(null)}
          onViewPayments={onOpenPayments}
        />
      )}
    </motion.div>
  )
}

/** Confirmation sheet that creates the reservation and holds the plot. */
function ReservePlotSheet({
  plot,
  onClose,
  onReserved,
}: {
  plot: ClientPlot
  onClose: () => void
  onReserved: (reservation: ClientReservation) => void
}) {
  const [plotCategory, setPlotCategory] = useState<PlotCategory>(plot.type)
  const [date, setDate] = useState(todayIso)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingReservation, setPendingReservation] =
    useState<ClientReservation | null>(null)
  const idFileRef = useRef<HTMLInputElement>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const idFile = idFileRef.current?.files?.[0]
    if (!pendingReservation && !idFile) {
      setError("Upload one valid government-issued ID to apply.")
      return
    }
    setBusy(true)
    setError(null)
    let created = pendingReservation
    try {
      if (!created) {
        created = await createClientReservation({
          plotId: plot.id,
          date,
          plotCategory,
        })
        setPendingReservation(created)
      }
      if (!idFile) {
        throw new Error("Choose an ID file to finish your reservation.")
      }
      await uploadAttachment(
        created.id,
        new File([idFile], `Valid ID - ${idFile.name}`, {
          type: idFile.type,
        })
      )
      reloadClientData()
      onReserved(created)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(
        created
          ? `Reservation created, but the ID upload failed. Choose the file again and retry: ${message}`
          : message
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reserve plot ${plot.plot_number}`}
      description={`${plot.cemetery} — ${plot.location}`}
    >
      <form onSubmit={submit} className="space-y-3">
        {error && <ErrorNote message={error} />}

        <div className="rounded-xl bg-cream px-3 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-deep/60">
              Section {plot.section} · {plot.type}
            </span>
            <span className="text-lg font-bold text-navy">
              {pesos(plot.price)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-deep/50">{plot.size}</p>
        </div>

        <div>
          <label className={LABEL} htmlFor="reserve-plot-category">
            Plot category
          </label>
          <select
            id="reserve-plot-category"
            value={plotCategory}
            onChange={(e) => setPlotCategory(e.target.value as PlotCategory)}
            className={INPUT}
          >
            {PLOT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="reserve-valid-id">
            <Upload size={12} className="mr-1 inline" />
            One valid government-issued ID
          </label>
          <input
            ref={idFileRef}
            id="reserve-valid-id"
            type="file"
            accept="image/*,.pdf"
            required={!pendingReservation}
            className={INPUT}
          />
          <p className="mt-1 text-[11px] text-deep/50">
            Upload a clear photo or PDF. This will be attached to your
            reservation.
          </p>
        </div>

        <div>
          <label className={LABEL} htmlFor="reserve-date">
            Preferred schedule
          </label>
          <input
            id="reserve-date"
            type="date"
            required
            min={todayIso()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT}
          />
        </div>

        <p className="rounded-xl bg-teal/10 px-3 py-2.5 text-[11px] text-deep/70">
          <CalendarCheck size={12} className="mr-1 inline" />
          Reserving holds this plot for your family. The office reviews the
          details and confirms the booking; no charge is made until you submit a
          payment.
        </p>

        <button
          type="submit"
          disabled={busy}
          className="client-primary-button w-full py-3 text-sm font-semibold disabled:opacity-60"
        >
          {busy
            ? pendingReservation
              ? "Uploading ID..."
              : "Reserving..."
            : pendingReservation
              ? "Retry ID upload"
              : "Reserve this plot"}
        </button>
      </form>
    </Modal>
  )
}
