import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { EASE_OUT } from "@/lib/motion"
import { formatCurrency } from "@/lib/format"
import type { Agreement, Payment } from "@/types/domain"

/** Percentage of a total, safe when the total is zero (empty dataset). */
function pct(value: number, total: number): number {
  return total ? (value / total) * 100 : 0
}

/** Payment totals, status breakdown and remaining balance. */
export function PaymentSummaryCard({ payments }: { payments: Payment[] }) {
  const totalCollected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0)
  const remaining = payments
    .filter((p) => p.status !== "Paid")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <Card title="Payment Summary">
      <div className="space-y-3">
        <div className="neu-sm p-3">
          <p className="text-[11px] text-deep uppercase">Amount Collected</p>
          <p className="text-xl font-bold">{formatCurrency(totalCollected)}</p>
          <p className="text-[11px] text-deep">
            of {payments.length} transactions
          </p>
        </div>
        <div>
          <div className="flex h-2.5 overflow-hidden rounded-full">
            <motion.span
              className="bg-teal"
              initial={{ width: 0 }}
              animate={{
                width: `${pct(payments.filter((p) => p.status === "Paid").length, payments.length)}%`,
              }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
            />
            <motion.span
              className="bg-deep/60"
              initial={{ width: 0 }}
              animate={{
                width: `${pct(payments.filter((p) => p.status === "Pending").length, payments.length)}%`,
              }}
              transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.08 }}
            />
            <motion.span
              className="bg-navy"
              initial={{ width: 0 }}
              animate={{
                width: `${pct(payments.filter((p) => p.status === "Overdue").length, payments.length)}%`,
              }}
              transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.16 }}
            />
          </div>
          <div className="mt-2 grid grid-cols-3 text-center text-[11px]">
            <p>
              <span className="font-bold text-teal">
                {payments.filter((p) => p.status === "Paid").length}
              </span>{" "}
              Paid
            </p>
            <p>
              <span className="font-bold text-deep">
                {payments.filter((p) => p.status === "Pending").length}
              </span>{" "}
              Pending
            </p>
            <p>
              <span className="font-bold text-navy">
                {payments.filter((p) => p.status === "Overdue").length}
              </span>{" "}
              Overdue
            </p>
          </div>
        </div>
        <div className="neu-sm flex justify-between px-3 py-2 text-sm">
          <span className="text-deep">Remaining Balance</span>
          <span className="font-bold">{formatCurrency(remaining)}</span>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="neu-button px-3 py-1.5 text-xs">
          View All Payments
        </button>
      </div>
    </Card>
  )
}

/** Agreement totals and status breakdown. */
export function AgreementSummaryCard({
  agreements,
}: {
  agreements: Agreement[]
}) {
  const byStatus = (status: Agreement["status"]) =>
    agreements.filter((a) => a.status === status).length

  return (
    <Card title="Agreement Summary">
      <div className="space-y-3">
        <div className="neu-sm p-3">
          <p className="text-[11px] text-deep uppercase">Total Agreements</p>
          <p className="text-xl font-bold">{agreements.length}</p>
          <p className="text-xs text-deep">
            {byStatus("Active")} out of {agreements.length} agreements are
            active.
          </p>
        </div>
        <div>
          <div className="flex h-2.5 overflow-hidden rounded-full">
            <motion.span
              className="bg-deep/60"
              initial={{ width: 0 }}
              animate={{
                width: `${pct(byStatus("Pending"), agreements.length)}%`,
              }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
            />
            <motion.span
              className="bg-teal"
              initial={{ width: 0 }}
              animate={{
                width: `${pct(byStatus("Active"), agreements.length)}%`,
              }}
              transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.08 }}
            />
            <motion.span
              className="bg-navy"
              initial={{ width: 0 }}
              animate={{
                width: `${pct(byStatus("Completed"), agreements.length)}%`,
              }}
              transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.16 }}
            />
            <motion.span
              className="bg-navy/20"
              initial={{ width: 0 }}
              animate={{
                width: `${pct(byStatus("Cancelled"), agreements.length)}%`,
              }}
              transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.24 }}
            />
          </div>
          <div className="mt-2 grid grid-cols-4 text-center text-[11px]">
            <p>
              <span className="font-bold text-deep">{byStatus("Pending")}</span>{" "}
              Pending
            </p>
            <p>
              <span className="font-bold text-teal">{byStatus("Active")}</span>{" "}
              Active
            </p>
            <p>
              <span className="font-bold text-navy">
                {byStatus("Completed")}
              </span>{" "}
              Completed
            </p>
            <p>
              <span className="font-bold text-navy/50">
                {byStatus("Cancelled")}
              </span>{" "}
              Cancelled
            </p>
          </div>
        </div>
        <div className="neu-sm flex justify-between px-3 py-2 text-sm">
          <span className="text-deep">Completed Agreements</span>
          <span className="font-bold">{byStatus("Completed")}</span>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <button className="neu-button px-3 py-1.5 text-xs">
          View All Agreements
        </button>
      </div>
    </Card>
  )
}
