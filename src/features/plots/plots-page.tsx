import {
  CalendarCheck,
  CheckCircle,
  Home,
  LayoutGrid,
  Search,
} from "lucide-react"
import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { cemeteryName } from "@/components/cemetery-selector"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { useData } from "@/data/store"
import { formatCurrency } from "@/lib/format"
import { fadeUp, rowItem, rowList, stagger } from "@/lib/motion"
import { usePagination } from "@/lib/use-pagination"
import {
  DeletePlotModal,
  EditPlotModal,
} from "@/features/shared/record-dialogs"
import type { Plot } from "@/types/domain"

export function PlotsPage() {
  const { cemeteries, plots } = useData()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [cemeteryFilter, setCemeteryFilter] = useState("All")
  const [editing, setEditing] = useState<Plot | null>(null)
  const [deleting, setDeleting] = useState<Plot | null>(null)

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
          (cemeteryFilter === "All" || p.cemeteryId === cemeteryFilter)
      ),
    [plots, query, statusFilter, typeFilter, cemeteryFilter]
  )
  const {
    page,
    pageCount,
    current: rows,
    setPage,
  } = usePagination(filtered, 12)

  return (
    <motion.div
      variants={stagger(0.08, 0.03)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div
        variants={stagger(0.06, 0.05)}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {(
          [
            {
              label: "Total Plots",
              value: plots.length,
              icon: LayoutGrid,
              trend: { up: false, text: "6%" },
            },
            {
              label: "Available Plots",
              value: plots.filter((p) => p.status === "Available").length,
              icon: CheckCircle,
              trend: { up: true, text: "2%" },
            },
            {
              label: "Reserved Plots",
              value: plots.filter((p) => p.status === "Reserved").length,
              icon: CalendarCheck,
              trend: { up: true, text: "3%" },
            },
            {
              label: "Occupied Plots",
              value: plots.filter((p) => p.status === "Occupied").length,
              icon: Home,
              trend: { up: false, text: "4%" },
            },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile
            key={label}
            label={label}
            value={value}
            icon={icon}
            trend={trend}
          />
        ))}
      </motion.div>
      <motion.div variants={fadeUp}>
        <Card title="Plot Records">
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search plot number or section..."
                className="rounded-lg border border-deep/30 bg-cream py-1.5 pr-3 pl-9 text-sm"
              />
            </div>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
              <motion.tbody
                key={page}
                variants={rowList}
                initial="hidden"
                animate="show"
              >
                {rows.map((p) => (
                  <motion.tr
                    key={p.id}
                    variants={rowItem}
                    className="border-t border-deep/10"
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
                    <td>
                      <button
                        onClick={() => setEditing(p)}
                        className="neu-button px-2.5 py-1 text-[11px]"
                      >
                        Edit
                      </button>{" "}
                      <button
                        onClick={() => setDeleting(p)}
                        className="neu-button px-2.5 py-1 text-[11px]"
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </Card>
      </motion.div>

      <EditPlotModal record={editing} onClose={() => setEditing(null)} />
      <DeletePlotModal record={deleting} onClose={() => setDeleting(null)} />
    </motion.div>
  )
}
