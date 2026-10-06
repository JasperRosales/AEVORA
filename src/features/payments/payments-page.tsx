import { AlertCircle, Banknote, CheckCircle, Clock } from "lucide-react"
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { payments } from "@/data/mock"
import { formatCurrency } from "@/lib/format"
import { usePagination } from "@/lib/use-pagination"

export function PaymentsPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [methodFilter, setMethodFilter] = useState("All")

  const clearFilters = () => {
    setQuery("")
    setStatusFilter("All")
    setMethodFilter("All")
  }

  const filtered = useMemo(
    () =>
      payments.filter(
        (p) =>
          (p.clientName.toLowerCase().includes(query.toLowerCase()) ||
            p.receiptNumber.toLowerCase().includes(query.toLowerCase()) ||
            p.plotNumber.toLowerCase().includes(query.toLowerCase())) &&
          (statusFilter === "All" || p.status === statusFilter) &&
          (methodFilter === "All" || p.method === methodFilter),
      ),
    [query, statusFilter, methodFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 8)

  const collected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0)
  const overdueAmount = payments
    .filter((p) => p.status === "Overdue")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            { label: "Paid Payments", value: formatCurrency(collected), icon: CheckCircle, sub: `out of ${payments.filter((p) => p.status === "Paid").length} payments`, trend: { up: true, text: "2%" } },
            { label: "Pending Payments", value: formatCurrency(pendingAmount), icon: Clock, sub: `out of ${payments.filter((p) => p.status === "Pending").length} payments`, trend: { up: false, text: "3%" } },
            { label: "Overdue Payments", value: formatCurrency(overdueAmount), icon: AlertCircle, sub: `out of ${payments.filter((p) => p.status === "Overdue").length} payments`, trend: { up: true, text: "4%" } },
            { label: "Total Collected Payments", value: formatCurrency(collected), icon: Banknote, sub: `out of ${payments.length} payments`, trend: { up: true, text: "5%" } },
          ] as const
        ).map(({ label, value, icon, sub, trend }) => (
          <KpiTile key={label} label={label} value={value} icon={icon} sub={sub} trend={trend} />
        ))}
      </div>

      <Card title="Payment Records">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search receipt, client, or plot..."
            className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Statuses</option>
            {["Paid", "Pending", "Overdue"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Methods</option>
            {["Cash", "Bank Transfer", "Card", "Online"].map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            onClick={clearFilters}
            className="neu-button px-3 py-1.5 text-sm"
          >
            Clear Filters
          </button>
          <span className="ml-auto self-center text-sm text-deep">
            Pending: {formatCurrency(pendingAmount)} · Overdue:{" "}
            {formatCurrency(overdueAmount)}
          </span>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Receipt No.</th>
              <th>Client</th>
              <th>Plot</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Method</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-t border-deep/10">
                <td className="py-1.5">{p.receiptNumber}</td>
                <td>{p.clientName}</td>
                <td>{p.plotNumber}</td>
                <td>{p.type}</td>
                <td>{formatCurrency(p.amount)}</td>
                <td>{p.date}</td>
                <td>{p.method}</td>
                <td>
                  <StatusBadge status={p.status} />
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
