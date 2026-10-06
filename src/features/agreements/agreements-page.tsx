import { CheckCircle, Clock, FileText, Flag } from "lucide-react"
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { cemeteryName } from "@/components/cemetery-selector"
import { agreements } from "@/data/mock"
import { usePagination } from "@/lib/use-pagination"

export function AgreementsPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")

  const clearFilters = () => {
    setQuery("")
    setStatusFilter("All")
    setTypeFilter("All")
  }

  const filtered = useMemo(
    () =>
      agreements.filter(
        (a) =>
          (a.clientName.toLowerCase().includes(query.toLowerCase()) ||
            a.agreementNumber.toLowerCase().includes(query.toLowerCase()) ||
            a.plotNumber.toLowerCase().includes(query.toLowerCase())) &&
          (statusFilter === "All" || a.status === statusFilter) &&
          (typeFilter === "All" || a.type === typeFilter),
      ),
    [query, statusFilter, typeFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 8)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            { label: "Total Agreements", value: agreements.length, icon: FileText, trend: { up: false, text: "3%" } },
            { label: "Pending Agreements", value: agreements.filter((a) => a.status === "Pending").length, icon: Clock, trend: { up: true, text: "4%" } },
            { label: "Active Agreements", value: agreements.filter((a) => a.status === "Active").length, icon: CheckCircle, trend: { up: true, text: "5%" } },
            { label: "Completed Agreements", value: agreements.filter((a) => a.status === "Completed").length, icon: Flag, trend: { up: false, text: "6%" } },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile key={label} label={label} value={value} icon={icon} trend={trend} />
        ))}
      </div>
      <Card title="Agreement Records">
      <div className="mb-3 flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agreement, client, or plot..."
          className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
        >
          <option value="All">All Statuses</option>
          {["Pending", "Active", "Completed", "Cancelled"].map((s) => (
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
          {[
            "Reservation Agreement",
            "Deed of Sale",
            "Maintenance Agreement",
          ].map((t) => (
            <option key={t} value={t}>
              {t}
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
            <th>Agreement No.</th>
            <th>Client</th>
            <th>Plot</th>
            <th>Cemetery</th>
            <th>Type</th>
            <th>Date Signed</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="border-t border-deep/10">
              <td className="py-1.5">{a.agreementNumber}</td>
              <td>{a.clientName}</td>
              <td>{a.plotNumber}</td>
              <td>{cemeteryName(a.cemeteryId)}</td>
              <td>{a.type}</td>
              <td>{a.dateSigned}</td>
              <td>
                <StatusBadge status={a.status} />
              </td>
              <td>
                <button className="neu-button px-2.5 py-1 text-[11px]">Edit</button>{" "}
                <button className="neu-button px-2.5 py-1 text-[11px]">Delete</button>
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
