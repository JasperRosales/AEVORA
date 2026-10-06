import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { cemeteryName } from "@/components/cemetery-selector"
import { reservations } from "@/data/mock"
import { usePagination } from "@/lib/use-pagination"

const flowSteps = [
  "Choose Plot",
  "Enter Information",
  "Upload Valid ID",
  "Information Checking",
  "Confirmation",
  "Agreement Created",
]

export function ReservationsPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const filtered = useMemo(
    () =>
      reservations.filter(
        (r) =>
          (r.clientName.toLowerCase().includes(query.toLowerCase()) ||
            r.reservationNumber.toLowerCase().includes(query.toLowerCase()) ||
            r.plotNumber.toLowerCase().includes(query.toLowerCase())) &&
          (statusFilter === "All" || r.status === statusFilter),
      ),
    [query, statusFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 8)

  return (
    <div className="space-y-4">
      <Card title="Reservation Flow">
        <ol className="flex flex-wrap items-center gap-2 text-xs">
          {flowSteps.map((step, i) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-deep px-2.5 py-1 text-cream">
                {i + 1}. {step}
              </span>
              {i < flowSteps.length - 1 && <span className="text-deep">→</span>}
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          ["Pending", "Under Verification", "Confirmed", "Cancelled"] as const
        ).map((s) => (
          <Card key={s}>
            <p className="text-xs text-deep uppercase">{s}</p>
            <p className="text-xl font-bold">
              {reservations.filter((r) => r.status === s).length}
            </p>
          </Card>
        ))}
      </div>

      <Card title="Reservation Records">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reservation, client, or plot..."
            className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Statuses</option>
            {["Pending", "Under Verification", "Confirmed", "Cancelled"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Reservation No.</th>
              <th>Client</th>
              <th>Cemetery</th>
              <th>Plot</th>
              <th>Date</th>
              <th>Burial Type</th>
              <th>Verification</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-deep/10">
                <td className="py-1.5">{r.reservationNumber}</td>
                <td>{r.clientName}</td>
                <td>{cemeteryName(r.cemeteryId)}</td>
                <td>{r.plotNumber}</td>
                <td>{r.date}</td>
                <td>{r.burialType}</td>
                <td>
                  <StatusBadge status={r.verification} />
                </td>
                <td>
                  <StatusBadge status={r.status} />
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
