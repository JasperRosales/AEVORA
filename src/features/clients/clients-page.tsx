import { Clock, UserCheck, Users, UserX } from "lucide-react"
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { clients } from "@/data/mock"
import { usePagination } from "@/lib/use-pagination"

export function ClientsPage() {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")

  const clearFilters = () => {
    setQuery("")
    setTypeFilter("All")
    setStatusFilter("All")
  }

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          (c.fullName.toLowerCase().includes(query.toLowerCase()) ||
            c.clientId.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase())) &&
          (typeFilter === "All" || c.type === typeFilter) &&
          (statusFilter === "All" || c.status === statusFilter),
      ),
    [query, typeFilter, statusFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 8)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            { label: "Total Clients", value: clients.length, icon: Users, trend: { up: true, text: "2%" } },
            { label: "Active Clients", value: clients.filter((c) => c.status === "Active").length, icon: UserCheck, trend: { up: true, text: "3%" } },
            { label: "Inactive Clients", value: clients.filter((c) => c.status === "Inactive").length, icon: UserX, trend: { up: false, text: "4%" } },
            { label: "Pending Clients", value: clients.filter((c) => c.status === "Pending").length, icon: Clock, trend: { up: true, text: "5%" } },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile key={label} label={label} value={value} icon={icon} trend={trend} />
        ))}
      </div>
      <Card title="Client Records">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Types</option>
            <option value="Individual">Individual</option>
            <option value="Corporate">Corporate</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Statuses</option>
            {["Active", "Inactive", "Pending"].map((s) => (
              <option key={s} value={s}>
                {s}
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
              <th>Client ID</th>
              <th>Full Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Type</th>
              <th>Registered</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-deep/10">
                <td className="py-1.5">{c.clientId}</td>
                <td>{c.fullName}</td>
                <td>{c.contactNumber}</td>
                <td>{c.email}</td>
                <td>{c.type}</td>
                <td>{c.registeredAt}</td>
                <td>
                  <StatusBadge status={c.status} />
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
