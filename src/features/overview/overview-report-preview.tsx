import { ArrowRight, Download, FileText } from "lucide-react"
import { motion } from "motion/react"
import { Modal } from "@/components/ui/modal"
import { rowItem, rowList, stagger } from "@/lib/motion"
import {
  downloadReportCsv,
  type Report,
  type ReportSection,
} from "./overview-reports"

/**
 * Preview of a generated report: headline numbers, a grouped breakdown, and the
 * detail table that the CSV download writes out. Opened by the report tiles on
 * the Overview (and by the Generate Report action).
 */
export function ReportPreviewModal({
  report,
  onClose,
  onOpenReports,
}: {
  report: Report
  onClose: () => void
  onOpenReports: () => void
}) {
  return (
    <Modal
      open
      onClose={onClose}
      title={`${report.type} Report`}
      description={`Generated ${new Date().toLocaleString("en-US")} · ${report.table.rows.length} row${report.table.rows.length === 1 ? "" : "s"}`}
    >
      <motion.div
        variants={stagger(0.06, 0.03)}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.div
          variants={rowItem}
          className="grid grid-cols-2 gap-2 lg:grid-cols-4"
        >
          {report.summary.map((item) => (
            <SummaryTile key={item.label} {...item} />
          ))}
        </motion.div>

        <motion.div variants={rowItem}>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-deep uppercase">
            Breakdown
          </h3>
          {report.breakdown.length === 0 ? (
            <p className="text-xs text-deep/60">
              No records to break down yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {report.breakdown.map((item) => (
                <span
                  key={item.label}
                  className="neu-sm flex items-center gap-2 px-3 py-1.5 text-xs"
                >
                  <span className="font-medium">{item.label}</span>
                  <span className="font-bold text-navy">{item.value}</span>
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={rowItem}>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-deep uppercase">
            Details
          </h3>
          <div className="overflow-x-auto rounded-xl border border-deep/10">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="bg-navy/5 text-left text-xs text-deep uppercase">
                  {report.table.columns.map((column) => (
                    <th key={column} className="px-3 py-2 whitespace-nowrap">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <motion.tbody variants={rowList} initial="hidden" animate="show">
                {report.table.rows.map((row, index) => (
                  <motion.tr
                    key={`${report.type}-${index}`}
                    variants={rowItem}
                    className="border-t border-deep/10"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={`${report.type}-${index}-${cellIndex}`}
                        className={`px-3 py-2 whitespace-nowrap ${cellIndex === 0 ? "font-medium" : ""}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </motion.tr>
                ))}
                {report.table.rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={report.table.columns.length}
                      className="px-3 py-8 text-center text-sm text-deep/60"
                    >
                      Nothing to report yet.
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>

      <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
        <motion.button
          type="button"
          onClick={onOpenReports}
          whileTap={{ scale: 0.97 }}
          className="neu-button px-3 py-2 text-sm"
        >
          <FileText size={13} className="mr-1 inline" /> View in Reports
          <ArrowRight size={13} className="ml-1 inline" />
        </motion.button>
        <motion.button
          type="button"
          onClick={() => downloadReportCsv(report)}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep"
        >
          <Download size={13} className="mr-1 inline" /> Download CSV
        </motion.button>
      </div>
    </Modal>
  )
}

function SummaryTile({ label, value }: ReportSection) {
  return (
    <div className="neu-sm px-3 py-2">
      <p className="text-[10px] tracking-wide text-deep uppercase">{label}</p>
      <p className="text-base font-bold text-navy">{value}</p>
    </div>
  )
}
