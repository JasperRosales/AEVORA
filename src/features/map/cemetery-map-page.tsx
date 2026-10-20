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
import { useData } from "@/data/store"
import { formatCurrency } from "@/lib/format"
import { fadeUp, pageSwap, stagger } from "@/lib/motion"
import { plotStatusFill } from "@/lib/status"
import type { BurialType, Plot, PlotStatus } from "@/types/domain"
import { PlotDetailsCard } from "./plot-details-panel"
import { PlotListView } from "./plot-list-view"
import { PlotMapCard } from "./plot-map-canvas"

/**
 * Cemetery map page: KPI strip, filter bar, and a Map/List view of every
 * plot in the selected cemetery.
 */
export function CemeteryMapPage() {
  const { cemeteries, plots } = useData()
  const [cemeteryId, setCemeteryId] = useState("")
  // Falls back to the first cemetery until the user picks one (data loads async).
  const activeCemeteryId = cemeteryId || cemeteries[0]?.id || ""
  const [burialType, setBurialType] = useState<BurialType | "All">("All")
  const [section, setSection] = useState("All")
  const [status, setStatus] = useState<PlotStatus | "All">("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Plot | null>(null)
  const [view, setView] = useState<"Map" | "List">("Map")

  const visiblePlots = useMemo(
    () =>
      plots.filter(
        (p) =>
          p.cemeteryId === activeCemeteryId &&
          (burialType === "All" || p.type === burialType) &&
          (section === "All" || p.section === section) &&
          (status === "All" || p.status === status)
      ),
    [activeCemeteryId, burialType, section, status, plots]
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

  function locate() {
    const match = plots.find(
      (p) =>
        p.cemeteryId === activeCemeteryId &&
        (p.plotNumber.toLowerCase() === search.toLowerCase() ||
          p.plotNumber.toLowerCase().includes(search.toLowerCase()))
    )
    if (match) setSelected(match)
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
              label: "Plots Pending Verification",
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

      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={activeCemeteryId}
              onChange={(e) => setCemeteryId(e.target.value)}
              className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
            >
              {cemeteries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={burialType}
              onChange={(e) =>
                setBurialType(e.target.value as BurialType | "All")
              }
              className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
            >
              <option value="All">All Types</option>
              <option value="Private">Private</option>
              <option value="Vertical">Vertical</option>
              <option value="Public">Public</option>
            </select>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
            >
              <option value="All">All Sections</option>
              {["A", "B", "C", "D"].map((s) => (
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
                setBurialType("All")
                setSection("All")
                setStatus("All")
                setSearch("")
              }}
              className="neu-button px-3 py-1.5 text-sm"
            >
              Clear Filters
            </button>
            <button onClick={locate} className="neu-button px-3 py-1.5 text-sm">
              Locate
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
            <PlotDetailsCard plot={selected} />
            <PlotMapCard
              plots={plots}
              cemeteryId={activeCemeteryId}
              burialType={burialType}
              section={section}
              status={status}
              selected={selected}
              onSelect={setSelected}
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
    </motion.div>
  )
}
