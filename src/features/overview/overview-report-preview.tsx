import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Download,
  FileText,
} from "lucide-react"
import { motion } from "motion/react"
import type { ReactNode } from "react"
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
      description="Aevora Cemetery Management System"
    >
      <motion.div
        variants={stagger(0.06, 0.03)}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        <motion.div
          variants={rowItem}
          className="relative overflow-hidden rounded-2xl bg-navy px-5 py-5 text-cream shadow-[0_12px_28px_rgba(6,22,51,0.2)]"
        >
          <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-teal/25 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-[10px] font-semibold tracking-[0.2em] text-cream/60 uppercase">
                Management report
              </p>
              <h3 className="text-xl font-semibold tracking-tight">
                {report.type}
              </h3>
              <p className="mt-1 text-xs text-cream/65">
                Generated {new Date().toLocaleString("en-US")} ·{" "}
                {report.table.rows.length}{" "}
                {report.table.rows.length === 1 ? "record" : "records"}
              </p>
            </div>
            <div className="hidden rounded-xl border border-cream/15 bg-cream/10 p-2.5 sm:block">
              <BarChart3 size={22} className="text-cream/80" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={rowItem}
          className="grid grid-cols-2 gap-3 lg:grid-cols-4"
        >
          {report.summary.map((item) => (
            <SummaryTile key={item.label} {...item} />
          ))}
        </motion.div>

        <motion.div variants={rowItem}>
          <SectionHeading
            icon={<CheckCircle2 size={14} />}
            title="At a glance"
          />
          {report.breakdown.length === 0 ? (
            <p className="text-xs text-deep/60">
              No records to break down yet.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {report.breakdown.map((item) => (
                <span
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-deep/10 bg-white/35 px-3 py-2.5 text-xs"
                >
                  <span className="font-medium text-deep/75">{item.label}</span>
                  <span className="font-bold text-navy">{item.value}</span>
                </span>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={rowItem}>
          <SectionHeading
            icon={<FileText size={14} />}
            title="Detailed records"
          />
          <div className="overflow-hidden rounded-2xl border border-deep/10 bg-white/25">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr                   className="bg-navy text-left text-[10px] tracking-wide !text-white uppercase">
                    {report.table.columns.map((column) => (
                      <th
                        key={column}
                        className="px-3 py-2.5 whitespace-nowrap"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <motion.tbody
                  variants={rowList}
                  initial="hidden"
                  animate="show"
                >
                  {report.table.rows.map((row, index) => (
                    <motion.tr
                      key={`${report.type}-${index}`}
                      variants={rowItem}
                      className="border-t border-deep/10"
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={`${report.type}-${index}-${cellIndex}`}
                          className={`px-3 py-2.5 whitespace-nowrap ${cellIndex === 0 ? "font-semibold text-navy" : "text-deep/80"}`}
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
                        className="px-3 py-10 text-center text-sm text-deep/60"
                      >
                        Nothing to report yet.
                      </td>
                    </tr>
                  )}
                </motion.tbody>
              </table>
            </div>
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
    <div className="rounded-xl border border-deep/10 bg-white/35 px-3 py-3">
      <p className="text-[10px] font-semibold tracking-wide text-deep/60 uppercase">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-bold text-navy">{value}</p>
    </div>
  )
}

function SectionHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-deep uppercase">
      <span className="text-teal">{icon}</span>
      {title}
    </h3>
  )
}
