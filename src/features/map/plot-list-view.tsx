import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/format"
import { rowItem, rowList } from "@/lib/motion"
import { usePagination } from "@/lib/use-pagination"
import type { Plot } from "@/types/domain"

/** Paginated table alternative to the map view. */
export function PlotListView({ plots }: { plots: Plot[] }) {
  const { page, pageCount, setPage } = usePagination(plots, 12)

  return (
    <Card title="Plot List">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Plot Number</th>
              <th>Section</th>
              <th>Burial Type</th>
              <th>Status</th>
              <th>Price</th>
              <th>Availability</th>
              <th />
            </tr>
          </thead>
          <motion.tbody
            key={page}
            variants={rowList}
            initial="hidden"
            animate="show"
          >
            {plots.slice((page - 1) * 12, page * 12).map((p) => (
              <motion.tr
                key={p.id}
                variants={rowItem}
                className="border-t border-deep/10"
              >
                <td className="py-1.5">{p.plotNumber}</td>
                <td>Section {p.section}</td>
                <td>{p.type}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>{formatCurrency(p.price)}</td>
                <td>
                  {p.status === "Available" ? "Available" : "Unavailable"}
                </td>
                <td>
                  <button className="neu-button px-2.5 py-1 text-[11px]">
                    Edit
                  </button>{" "}
                  <button className="neu-button px-2.5 py-1 text-[11px]">
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
  )
}
