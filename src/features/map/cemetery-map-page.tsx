import {
  Banknote,
  CalendarCheck,
  CheckCircle,
  Clock,
  Home,
  Search,
} from "lucide-react"
import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { updatePlotRow, useData } from "@/data/store"
import { formatCurrency } from "@/lib/format"
import { fadeUp, pageSwap, stagger } from "@/lib/motion"
import { updatePlot } from "@/lib/neon-api"
import { PLOT_CATEGORIES } from "@/lib/plot-category"
import { plotStatusFill } from "@/lib/status"
import type { Plot, PlotCategory, PlotStatus, Reservation } from "@/types/domain"
import { CreateReservationModal } from "@/features/overview/overview-action-modals"
import {
  DeletePlotModal,
  EditPlotModal,
} from "@/features/shared/record-dialogs"
import { ReservationDetailsModal } from "@/features/shared/reservation-review-modal"
import { PlotDetailsCard } from "./plot-details-panel"
import { PlotGridBuilderModal } from "./plot-grid-builder"
import { PlotListView } from "./plot-list-view"
import { PlotMapCard } from "./plot-map-canvas"

/**
 * Latest active reservation for a plot. Cancelled bookings are ignored: the
 * map panel reflects the plot's current state, while the Reservations screen
 * keeps the full history.
 */
function reservationForPlot(
  reservations: Reservation[],
  plot: Plot
): Reservation | null {
  const matches = reservations.filter(
    (r) =>
      r.cemeteryId === plot.cemeteryId &&
      r.plotNumber === plot.plotNumber &&
      r.status !== "Cancelled"
  )
  if (matches.length === 0) return null
  return matches.slice().sort((a, b) => b.date.localeCompare(a.date))[0]
}

/**
 * Cemetery map page: KPI strip, filter bar, and a Map/List view of every
 * plot in the selected cemetery.
 */
export function CemeteryMapPage() {
  const { cemeteries, plots, reservations } = useData()
  const [cemeteryId, setCemeteryId] = useState("")
  // Falls back to the first cemetery until the user picks one (data loads async).
  const activeCemeteryId = cemeteryId || cemeteries[0]?.id || ""
  const [category, setCategory] = useState<PlotCategory | "All">("All")
  const [section, setSection] = useState("All")
  const [status, setStatus] = useState<PlotStatus | "All">("All")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [view, setView] = useState<"Map" | "List">("Map")
  const [sectionColumns, setSectionColumns] = useState(2)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [statusBusy, setStatusBusy] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [reservingPlot, setReservingPlot] = useState<Plot | null>(null)
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null)
  const [deletingPlot, setDeletingPlot] = useState<Plot | null>(null)
  const [reservationModal, setReservationModal] = useState<{
    reservation: Reservation
    mode: "view" | "review"
  } | null>(null)

  const sections = useMemo(
    () =>
      [
        ...new Set(
          plots
            .filter((p) => p.cemeteryId === activeCemeteryId)
            .map((p) => p.section)
        ),
      ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [activeCemeteryId, plots]
  )

  const visiblePlots = useMemo(
    () =>
      plots.filter(
        (p) =>
          p.cemeteryId === activeCemeteryId &&
          (category === "All" || p.type === category) &&
          (section === "All" || p.section === section) &&
          (status === "All" || p.status === status) &&
          (!search.trim() ||
            p.plotNumber.toLowerCase().includes(search.trim().toLowerCase()))
      ),
    [activeCemeteryId, category, section, status, search, plots]
  )

  // Pre-fill the form with the first unused section letter, so "Add plot"
  // creates a new parcel instead of extending section A by accident.
  const nextSection = useMemo(() => {
    const used = new Set(sections)
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i)
      if (!used.has(letter)) return letter
    }
    return "A"
  }, [sections])

  // Derive the selected plot from the store by id rather than keeping a
  // snapshot: status changes, bookings and edits replace the row, and the
  // details panel should always show the fresh version.
  const selected = useMemo(
    () => (selectedId ? (plots.find((p) => p.id === selectedId) ?? null) : null),
    [plots, selectedId]
  )

  const selectedReservation = useMemo(
    () => (selected ? reservationForPlot(reservations, selected) : null),
    [reservations, selected]
  )

  const stats = useMemo(() => {
    const list = plots.filter((p) => p.cemeteryId === activeCemeteryId)
    return {
      available: list.filter((p) => p.status === "Available").length,
      reserved: list.filter((p) => p.status === "Reserved").length,
      occupied: list.filter((p) => p.status === "Occupied").length,
      pending: list.filter((p) => p.status === "Waiting for Checking").length,
      revenue: list
        .filter((p) => p.status === "Occupied" || p.status === "Reserved")
        .reduce((sum, p) => sum + p.price, 0),
    }
  }, [activeCemeteryId, plots])

  function selectPlot(plot: Plot | null) {
    setSelectedId(plot?.id ?? null)
    setStatusError(null)
  }

  async function changePlotStatus(plot: Plot, next: PlotStatus) {
    if (next === plot.status || statusBusy) return
    setStatusBusy(true)
    setStatusError(null)
    try {
      const updated = await updatePlot(plot.id, {
        status: next,
        // Freeing a plot must also release the family it was held for.
        ...(next === "Available" ? { reservedFor: "" } : {}),
      })
      updatePlotRow(updated)
      setNotice(`Plot ${updated.plotNumber} is now ${updated.status}.`)
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : String(err))
    } finally {
      setStatusBusy(false)
    }
  }

  function viewReservation(reservation: Reservation | null) {
    if (!reservation) {
      setNotice("No reservation is linked to this plot yet.")
      return
    }
    setReservationModal({ reservation, mode: "view" })
  }

  function reviewReservation(reservation: Reservation | null) {
    if (!reservation) {
      setNotice("No information-checking request is linked to this plot yet.")
      return
    }
    setReservationModal({ reservation, mode: "review" })
  }

  const cemetery = cemeteries.find((c) => c.id === activeCemeteryId)

  return (
    <motion.div
      variants={stagger(0.08, 0.03)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div
        variants={stagger(0.06, 0.05)}
        className="grid grid-cols-2 gap-3 md:grid-cols-5"
      >
        {(
          [
            {
              label: "Available Plots",
              value: stats.available,
              icon: CheckCircle,
              trend: { up: false, text: "6%" },
            },
            {
              label: "Reserved Plots",
              value: stats.reserved,
              icon: CalendarCheck,
              trend: { up: true, text: "2%" },
            },
            {
              label: "Occupied Plots",
              value: stats.occupied,
              icon: Home,
              trend: { up: false, text: "3%" },
            },
            {
              label: "Plots to Verify",
              value: stats.pending,
              icon: Clock,
              trend: { up: true, text: "4%" },
            },
            {
              label: "Total Revenue",
              value: formatCurrency(stats.revenue),
              icon: Banknote,
              trend: { up: true, text: "5%" },
            },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile
            key={label}
            label={label}
            value={value}
            icon={icon}
            trend={trend}
          />
        ))}
      </motion.div>

      {notice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-3 rounded-xl bg-teal/20 px-4 py-3 text-sm text-deep"
        >
          <p>{notice}</p>
          <button
            onClick={() => setNotice(null)}
            className="shrink-0 text-xs font-semibold underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={activeCemeteryId}
              onChange={(e) => {
                setCemeteryId(e.target.value)
                setSection("All")
                setSelectedId(null)
              }}
              className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
            >
              {cemeteries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as PlotCategory | "All")
              }
              className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
            >
              <option value="All">All Types</option>
              {PLOT_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
            >
              <option value="All">All Sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  Section {s}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PlotStatus | "All")}
              className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
            >
              <option value="All">All Statuses</option>
              {Object.keys(plotStatusFill).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search
                size={14}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search plot number..."
                className="rounded-lg border border-deep/30 bg-cream py-1.5 pr-3 pl-9 text-sm"
              />
            </div>
            <button
              onClick={() => {
                setCemeteryId("")
                setCategory("All")
                setSection("All")
                setStatus("All")
                setSearch("")
              }}
              className="neu-button px-3 py-1.5 text-sm"
            >
              Clear Filters
            </button>
            <div className="ml-auto flex overflow-hidden rounded-lg border border-deep/30">
              {(["Map", "List"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`relative px-3 py-1.5 text-sm transition-colors duration-200 ${
                    view === v ? "text-cream" : "text-navy hover:bg-deep/5"
                  }`}
                >
                  {view === v && (
                    <motion.span
                      layoutId="map-view-toggle"
                      transition={{
                        type: "spring",
                        stiffness: 440,
                        damping: 34,
                      }}
                      className="absolute inset-0 bg-deep"
                    />
                  )}
                  <span className="relative z-10">{v} View</span>
                </button>
              ))}
            </div>
          </div>
          <p className="mt-2 text-xs text-deep">
            Now viewing <strong>{cemetery?.name ?? "no cemetery"}</strong>
            {cemetery ? ` — ${cemetery.location}` : ""}. {visiblePlots.length}{" "}
            plots match the current filters.
          </p>
        </Card>
      </motion.div>

      <AnimatePresence mode="wait" initial={false}>
        {view === "Map" ? (
          <motion.div
            key="map"
            variants={pageSwap}
            initial="hidden"
            animate="show"
            exit="exit"
            className="grid gap-4 lg:grid-cols-[300px_1fr]"
          >
            <PlotDetailsCard
              plot={selected}
              reservation={selectedReservation}
              onReserve={setReservingPlot}
              onViewReservation={viewReservation}
              onReviewReservation={reviewReservation}
              onViewDetails={setEditingPlot}
            />
            <PlotMapCard
              plots={plots}
              cemeteryId={activeCemeteryId}
              category={category}
              section={section}
              status={status}
              search={search}
              selected={selected}
              onSelect={selectPlot}
              onAddPlot={() => setBuilderOpen(true)}
              onDeletePlot={setDeletingPlot}
              onStatusChange={changePlotStatus}
              statusBusy={statusBusy}
              statusError={statusError}
              sectionColumns={sectionColumns}
              onSectionColumnsChange={setSectionColumns}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            variants={pageSwap}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <PlotListView plots={visiblePlots} />
          </motion.div>
        )}
      </AnimatePresence>

      {builderOpen && (
        <PlotGridBuilderModal
          cemeteryId={activeCemeteryId}
          initialSection={nextSection}
          onClose={() => setBuilderOpen(false)}
          onCreated={(message) => {
            setNotice(message)
            // Clear filters so the new plots are fully visible on the map.
            setSection("All")
            setStatus("All")
            setCategory("All")
            setSearch("")
          }}
        />
      )}

      {reservingPlot && (
        <CreateReservationModal
          open
          initialPlot={reservingPlot}
          onClose={() => setReservingPlot(null)}
          onCreated={(message) => {
            setNotice(message)
            setReservingPlot(null)
          }}
        />
      )}

      {reservationModal && (
        <ReservationDetailsModal
          key={`${reservationModal.reservation.id}-${reservationModal.mode}`}
          reservation={reservationModal.reservation}
          mode={reservationModal.mode}
          onClose={() => setReservationModal(null)}
          onUpdated={(message) => setNotice(message)}
        />
      )}

      {editingPlot && (
        <EditPlotModal
          record={editingPlot}
          onClose={() => setEditingPlot(null)}
        />
      )}

      <DeletePlotModal
        record={deletingPlot}
        onClose={() => setDeletingPlot(null)}
      />
    </motion.div>
  )
}