import { CalendarCheck, CheckCircle, Home, LayoutGrid } from "lucide-react"
import { useMemo, useState } from "react"
import { cemeteryName } from "@/components/cemetery-selector"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { cemeteries, plots } from "@/data/mock"
import { formatCurrency } from "@/lib/format"
import { usePagination } from "@/lib/use-pagination"

export function PlotsPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [cemeteryFilter, setCemeteryFilter] = useState("All")

  const clearFilters = () => {
    setQuery("")
    setStatusFilter("All")
    setTypeFilter("All")
    setCemeteryFilter("All")
  }

  const filtered = useMemo(
    () =>
      plots.filter(
        (p) =>
          (p.plotNumber.toLowerCase().includes(query.toLowerCase()) ||
            p.section.toLowerCase().includes(query.toLowerCase())) &&
          (statusFilter === "All" || p.status === statusFilter) &&
          (typeFilter === "All" || p.type === typeFilter) &&
          (cemeteryFilter === "All" || p.cemeteryId === cemeteryFilter),
      ),
    [query, statusFilter, typeFilter, cemeteryFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 12)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            { label: "Total Plots", value: plots.length, icon: LayoutGrid, trend: { up: false, text: "6%" } },
            { label: "Available Plots", value: plots.filter((p) => p.status === "Available").length, icon: CheckCircle, trend: { up: true, text: "2%" } },
            { label: "Reserved Plots", value: plots.filter((p) => p.status === "Reserved").length, icon: CalendarCheck, trend: { up: true, text: "3%" } },
            { label: "Occupied Plots", value: plots.filter((p) => p.status === "Occupied").length, icon: Home, trend: { up: false, text: "4%" } },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile key={label} label={label} value={value} icon={icon} trend={trend} />
        ))}
      </div>
      <Card title="Plot Records">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search plot number or section..."
            className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Statuses</option>
            {[
              "Available",
              "Reserved",
              "Occupied",
              "Waiting for Checking",
              "Unavailable",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Types</option>
            {["Private", "Vertical", "Public"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={cemeteryFilter}
            onChange={(e) => setCemeteryFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Cemeteries</option>
            {cemeteries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={clearFilters}
            className="neu-button px-3 py-1.5 text-sm"
          >
            Clear Filters
          </button>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Plot Number</th>
              <th>Cemetery</th>
              <th>Section</th>
              <th>Type</th>
              <th>Size</th>
              <th>Price</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-deep/10">
                <td className="py-1.5">{p.plotNumber}</td>
                <td>{cemeteryName(p.cemeteryId)}</td>
                <td>Section {p.section}</td>
                <td>{p.type}</td>
                <td>{p.size}</td>
                <td>{formatCurrency(p.price)}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>
                  <button className="neu-button px-2.5 py-1 text-[11px]">
                    Edit
                  </button>{" "}
                  <button className="neu-button px-2.5 py-1 text-[11px]">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>
    </div>
  )
}
