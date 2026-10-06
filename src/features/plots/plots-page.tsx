import { useMemo, useState } from "react"
import { cemeteryName } from "@/components/cemetery-selector"
import { Card } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { plots } from "@/data/mock"
import { formatCurrency } from "@/lib/format"
import { usePagination } from "@/lib/use-pagination"
import type { Plot } from "@/types/domain"

export function PlotsPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [selected, setSelected] = useState<Plot | null>(null)

  const filtered = useMemo(
    () =>
      plots.filter(
        (p) =>
          (p.plotNumber.toLowerCase().includes(query.toLowerCase()) ||
            p.section.toLowerCase().includes(query.toLowerCase())) &&
          (statusFilter === "All" || p.status === statusFilter) &&
          (typeFilter === "All" || p.type === typeFilter),
      ),
    [query, statusFilter, typeFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 12)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
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
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className="cursor-pointer border-t border-deep/10"
                onClick={() => setSelected(p)}
              >
                <td className="py-1.5">{p.plotNumber}</td>
                <td>{cemeteryName(p.cemeteryId)}</td>
                <td>Section {p.section}</td>
                <td>{p.type}</td>
                <td>{p.size}</td>
                <td>{formatCurrency(p.price)}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>

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
              <dt>Type</dt>
              <dd>{selected.type}</dd>
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
            <div className="mt-3 flex gap-2">
              <button className="neu-button px-3 py-1.5 text-xs">
                Edit Plot
              </button>
              <button className="neu-button px-3 py-1.5 text-xs">
                View History
              </button>
              <button className="neu-button px-3 py-1.5 text-xs">
                Map Location
              </button>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-deep/70">
            Select a plot to view and edit its record.
          </p>
        )}
      </Card>
    </div>
  )
}
