import { useMemo, useState } from "react"
import { Banknote, CalendarCheck, CheckCircle, Clock, Home, Maximize, Minus, Plus } from "lucide-react"
import { cemeteryName } from "@/components/cemetery-selector"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { cemeteries, plots } from "@/data/mock"
import { formatCurrency } from "@/lib/format"
import { plotStatusFill } from "@/lib/status"
import { usePagination } from "@/lib/use-pagination"
import type { BurialType, Plot, PlotStatus } from "@/types/domain"

const statusFill = Object.fromEntries(
  Object.entries(plotStatusFill).map(([k, v]) => [k, v.fill]),
) as Record<PlotStatus, string>

const CELL = 16
const GAP = 4
const SECTION_COLS = 6
const SECTION_ROWS = 4
const SECTION_W = SECTION_COLS * (CELL + GAP) + GAP
const SECTION_H = SECTION_ROWS * (CELL + GAP) + GAP + 16

export function CemeteryMapPage() {
  const [cemeteryId, setCemeteryId] = useState(cemeteries[0].id)
  const [burialType, setBurialType] = useState<BurialType | "All">("All")
  const [section, setSection] = useState("All")
  const [status, setStatus] = useState<PlotStatus | "All">("All")
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Plot | null>(null)
  const [zoom, setZoom] = useState(1)
  const [view, setView] = useState<"Map" | "List">("Map")

  const visiblePlots = useMemo(
    () =>
      plots.filter(
        (p) =>
          p.cemeteryId === cemeteryId &&
          (burialType === "All" || p.type === burialType) &&
          (section === "All" || p.section === section) &&
          (status === "All" || p.status === status),
      ),
    [cemeteryId, burialType, section, status],
  )

  const stats = useMemo(() => {
    const list = plots.filter((p) => p.cemeteryId === cemeteryId)
    return {
      available: list.filter((p) => p.status === "Available").length,
      reserved: list.filter((p) => p.status === "Reserved").length,
      occupied: list.filter((p) => p.status === "Occupied").length,
      pending: list.filter((p) => p.status === "Waiting for Checking").length,
      revenue: list
        .filter((p) => p.status === "Occupied" || p.status === "Reserved")
        .reduce((sum, p) => sum + p.price, 0),
    }
  }, [cemeteryId])

  function locate() {
    const match = plots.find(
      (p) =>
        p.cemeteryId === cemeteryId &&
        (p.plotNumber.toLowerCase() === search.toLowerCase() ||
          p.plotNumber.toLowerCase().includes(search.toLowerCase())),
    )
    if (match) setSelected(match)
  }

  const cemetery = cemeteries.find((c) => c.id === cemeteryId)!
  const {
    page: listPage,
    pageCount: listPageCount,
    setPage: setListPage,
  } = usePagination(visiblePlots, 12)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {(
          [
            { label: "Available Plots", value: stats.available, icon: CheckCircle, trend: { up: false, text: "6%" } },
            { label: "Reserved Plots", value: stats.reserved, icon: CalendarCheck, trend: { up: true, text: "2%" } },
            { label: "Occupied Plots", value: stats.occupied, icon: Home, trend: { up: false, text: "3%" } },
            { label: "Plots Pending Verification", value: stats.pending, icon: Clock, trend: { up: true, text: "4%" } },
            { label: "Total Revenue", value: formatCurrency(stats.revenue), icon: Banknote, trend: { up: true, text: "5%" } },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile key={label} label={label} value={value} icon={icon} trend={trend} />
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={cemeteryId}
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
            onChange={(e) => setBurialType(e.target.value as BurialType | "All")}
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
            onChange={(e) =>
              setStatus(e.target.value as PlotStatus | "All")
            }
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Statuses</option>
            {Object.keys(statusFill).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plot number..."
            className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => {
              setCemeteryId(cemeteries[0].id)
              setBurialType("All")
              setSection("All")
              setStatus("All")
              setSearch("")
            }}
            className="neu-button px-3 py-1.5 text-sm"
          >
            Clear Filters
          </button>
          <button
            onClick={locate}
            className="neu-button px-3 py-1.5 text-sm"
          >
            Locate
          </button>
          <div className="ml-auto flex overflow-hidden rounded-lg border border-deep/30">
            {(["Map", "List"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm ${view === v ? "bg-deep text-cream" : ""}`}
              >
                {v} View
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 text-xs text-deep">
          Now viewing <strong>{cemetery.name}</strong> — {cemetery.location}.{" "}
          {visiblePlots.length} plots match the current filters.
        </p>
      </Card>

      {view === "Map" ? (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Card title="Plot Details">
            {selected ? (
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt>Plot Number</dt>
                  <dd className="font-semibold">{selected.plotNumber}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Cemetery</dt>
                  <dd>{cemeteryName(selected.cemeteryId)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Section</dt>
                  <dd>Section {selected.section}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Row / Plot</dt>
                  <dd>
                    {selected.row} / {selected.column}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Burial Type</dt>
                  <dd>{selected.type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Plot Size</dt>
                  <dd>{selected.size}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Price</dt>
                  <dd>{formatCurrency(selected.price)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Status</dt>
                  <dd>
                    <StatusBadge status={selected.status} />
                  </dd>
                </div>
                {selected.reservedFor && (
                  <div className="flex justify-between">
                    <dt>Reserved For</dt>
                    <dd>{selected.reservedFor}</dd>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  {selected.status === "Available" && (
                    <button className="neu-button px-3 py-1.5 text-xs">
                      Reserve Plot
                    </button>
                  )}
                  {selected.status === "Reserved" && (
                    <button className="neu-button px-3 py-1.5 text-xs">
                      View Reservation
                    </button>
                  )}
                  {selected.status === "Waiting for Checking" && (
                    <button className="neu-button px-3 py-1.5 text-xs">
                      Review Request
                    </button>
                  )}
                  <button className="neu-button px-3 py-1.5 text-xs">
                    View Details
                  </button>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-deep/70">
                Select a plot on the map to view its details.
              </p>
            )}
          </Card>

          <Card title="Cemetery Map" action={
            <div className="flex gap-1">
              <button
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="neu-button rounded-lg p-1.5"
                title="Zoom in"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                className="neu-button rounded-lg p-1.5"
                title="Zoom out"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="neu-button rounded-lg p-1.5"
                title="Reset view"
              >
                <Maximize size={14} />
              </button>
            </div>
          }>
            <div className="overflow-auto">
              <svg
                width={SECTION_W * 2 + 60}
                height={SECTION_H * 2 + 40}
                className="bg-cream"
                style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
              >
                <text x={20} y={20} className="fill-deep text-xs">
                  Main Entrance
                </text>
                {["A", "B", "C", "D"].map((sec, i) => {
                  const originX = 30 + (i % 2) * (SECTION_W + 40)
                  const originY = 30 + Math.floor(i / 2) * (SECTION_H + 20)
                  return (
                    <g key={sec}>
                      <text
                        x={originX}
                        y={originY - 4}
                        className="fill-navy text-xs font-semibold"
                      >
                        Section {sec}
                      </text>
                      <rect
                        x={originX - GAP}
                        y={originY}
                        width={SECTION_W}
                        height={SECTION_H - 14}
                        rx={6}
                        fill="#102B52"
                        opacity={0.08}
                      />
                      {plots
                        .filter(
                          (p) =>
                            p.cemeteryId === cemeteryId && p.section === sec,
                        )
                        .map((p) => {
                          const matches =
                            (burialType === "All" || p.type === burialType) &&
                            (section === "All" || p.section === section) &&
                            (status === "All" || p.status === status)
                          return (
                            <rect
                              key={p.id}
                              x={
                                originX +
                                GAP +
                                (p.column - 1) * (CELL + GAP)
                              }
                              y={originY + 18 + (p.row - 1) * (CELL + GAP)}
                              width={CELL}
                              height={CELL}
                              rx={2}
                              style={{
                                fill: plotStatusFill[p.status].fill,
                                fillOpacity: matches
                                  ? (plotStatusFill[p.status].fillOpacity ?? 1)
                                  : 0.15,
                                stroke:
                                  selected?.id === p.id
                                    ? "var(--color-navy)"
                                    : (plotStatusFill[p.status].stroke ?? "none"),
                                strokeWidth: selected?.id === p.id ? 2 : 1,
                              }}
                              className="cursor-pointer"
                              onClick={() => setSelected(p)}
                            >
                              <title>
                                {p.plotNumber} — {p.status}
                              </title>
                            </rect>
                          )
                        })}
                    </g>
                  )
                })}
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              {(Object.keys(statusFill) as PlotStatus[]).map((s) => (
                <span key={s} className="flex items-center gap-1">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: statusFill[s] }}
                  />
                  {s}
                </span>
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <Card title="Plot List">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-deep uppercase">
                <th>Plot Number</th>
                <th>Section</th>
                <th>Burial Type</th>
                <th>Status</th>
                <th>Price</th>
                <th>Availability</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visiblePlots.slice((listPage - 1) * 12, listPage * 12).map((p) => (
                <tr key={p.id} className="border-t border-deep/10">
                  <td className="py-1.5">{p.plotNumber}</td>
                  <td>Section {p.section}</td>
                  <td>{p.type}</td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td>{formatCurrency(p.price)}</td>
                  <td>{p.status === "Available" ? "Available" : "Unavailable"}</td>
                  <td>
                    <button className="neu-button px-2.5 py-1 text-[11px]">Edit</button>{" "}
                    <button className="neu-button px-2.5 py-1 text-[11px]">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <Pagination
            page={listPage}
            pageCount={listPageCount}
            onChange={setListPage}
          />
        </Card>
      )}
    </div>
  )
}
