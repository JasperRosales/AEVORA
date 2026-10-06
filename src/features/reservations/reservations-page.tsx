import { CheckCircle, Clock, Search, XCircle } from "lucide-react"
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { cemeteryName } from "@/components/cemetery-selector"
import { reservations } from "@/data/mock"
import { usePagination } from "@/lib/use-pagination"

export function ReservationsPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [verificationFilter, setVerificationFilter] = useState("All")
  const [burialTypeFilter, setBurialTypeFilter] = useState("All")

  const clearFilters = () => {
    setQuery("")
    setStatusFilter("All")
    setVerificationFilter("All")
    setBurialTypeFilter("All")
  }

  const filtered = useMemo(
    () =>
      reservations.filter(
        (r) =>
          (r.clientName.toLowerCase().includes(query.toLowerCase()) ||
            r.reservationNumber.toLowerCase().includes(query.toLowerCase()) ||
            r.plotNumber.toLowerCase().includes(query.toLowerCase())) &&
          (statusFilter === "All" || r.status === statusFilter) &&
          (verificationFilter === "All" ||
            r.verification === verificationFilter) &&
          (burialTypeFilter === "All" || r.burialType === burialTypeFilter),
      ),
    [query, statusFilter, verificationFilter, burialTypeFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 8)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            { label: "Pending Reservations", value: reservations.filter((r) => r.status === "Pending").length, icon: Clock, trend: { up: true, text: "4%" } },
            { label: "Reservations Under Verification", value: reservations.filter((r) => r.status === "Under Verification").length, icon: Search, trend: { up: true, text: "5%" } },
            { label: "Confirmed Reservations", value: reservations.filter((r) => r.status === "Confirmed").length, icon: CheckCircle, trend: { up: false, text: "6%" } },
            { label: "Cancelled Reservations", value: reservations.filter((r) => r.status === "Cancelled").length, icon: XCircle, trend: { up: true, text: "2%" } },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile key={label} label={label} value={value} icon={icon} trend={trend} />
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
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Verifications</option>
            {[
              "Waiting for Checking",
              "Under Review",
              "Verified",
              "Requires Action",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={burialTypeFilter}
            onChange={(e) => setBurialTypeFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Burial Types</option>
            {["Private", "Vertical", "Public"].map((t) => (
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
              <th>Reservation No.</th>
              <th>Client</th>
              <th>Cemetery</th>
              <th>Plot</th>
              <th>Date</th>
              <th>Burial Type</th>
              <th>Verification</th>
              <th>Status</th>
              <th />
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
