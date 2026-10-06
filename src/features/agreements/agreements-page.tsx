import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { cemeteryName } from "@/components/cemetery-selector"
import { agreements } from "@/data/mock"
import { usePagination } from "@/lib/use-pagination"

export function AgreementsPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const filtered = useMemo(
    () =>
      agreements.filter(
        (a) =>
          (a.clientName.toLowerCase().includes(query.toLowerCase()) ||
            a.agreementNumber.toLowerCase().includes(query.toLowerCase()) ||
            a.plotNumber.toLowerCase().includes(query.toLowerCase())) &&
          (statusFilter === "All" || a.status === statusFilter),
      ),
    [query, statusFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 8)

  return (
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
                <button className="neu-button px-2.5 py-1 text-[11px]">View</button>{" "}
                <button className="neu-button px-2.5 py-1 text-[11px]">
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <Pagination page={page} pageCount={pageCount} onChange={setPage} />
    </Card>
  )
}
