import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { payments } from "@/data/mock"
import { formatCurrency } from "@/lib/format"
import { usePagination } from "@/lib/use-pagination"

export function PaymentsPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")

  const filtered = useMemo(
    () =>
      payments.filter(
        (p) =>
          (p.clientName.toLowerCase().includes(query.toLowerCase()) ||
            p.receiptNumber.toLowerCase().includes(query.toLowerCase()) ||
            p.plotNumber.toLowerCase().includes(query.toLowerCase())) &&
          (statusFilter === "All" || p.status === statusFilter),
      ),
    [query, statusFilter],
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
        {[
          ["Paid", payments.filter((p) => p.status === "Paid").length],
          ["Pending", payments.filter((p) => p.status === "Pending").length],
          ["Overdue", payments.filter((p) => p.status === "Overdue").length],
          ["Total Collected", formatCurrency(collected)],
        ].map(([label, value]) => (
          <Card key={label as string}>
            <p className="text-xs text-deep uppercase">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </Card>
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
              </tr>
            ))}
          </tbody>
        </table></div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>
    </div>
  )
}
