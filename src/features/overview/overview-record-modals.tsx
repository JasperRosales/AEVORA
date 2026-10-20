import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { Search } from "lucide-react"
import { cemeteryName } from "@/components/cemetery-selector"
import { Modal } from "@/components/ui/modal"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/format"
import { rowItem, rowList } from "@/lib/motion"
import type {
  Agreement,
  AgreementStatus,
  Payment,
  PaymentStatus,
} from "@/types/domain"

const PAYMENT_STATUSES: PaymentStatus[] = ["Paid", "Pending", "Overdue"]
const AGREEMENT_STATUSES: AgreementStatus[] = [
  "Pending",
  "Active",
  "Completed",
  "Cancelled",
]

/** Animated, searchable list of every payment. Mounted only while the modal is open. */
function PaymentsBrowser({ payments }: { payments: Payment[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<PaymentStatus | "All">("All")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return payments.filter(
      (p) =>
        (status === "All" || p.status === status) &&
        (!q ||
          p.receiptNumber.toLowerCase().includes(q) ||
          p.clientName.toLowerCase().includes(q) ||
          p.plotNumber.toLowerCase().includes(q))
    )
  }, [payments, query, status])

  const sums = useMemo(() => {
    const total = (s: PaymentStatus) =>
      payments
        .filter((p) => p.status === s)
        .reduce((sum, p) => sum + p.amount, 0)
    return {
      paid: total("Paid"),
      pending: total("Pending"),
      overdue: total("Overdue"),
    }
  }, [payments])

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <SummaryChip
          label="Collected"
          value={formatCurrency(sums.paid)}
          tone="text-teal"
        />
        <SummaryChip
          label="Pending"
          value={formatCurrency(sums.pending)}
          tone="text-deep"
        />
        <SummaryChip
          label="Overdue"
          value={formatCurrency(sums.overdue)}
          tone="text-red-600"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search
            size={14}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search receipt, client, or plot..."
            aria-label="Search payments"
            className="w-full rounded-lg border border-deep/30 bg-cream py-1.5 pr-3 pl-9 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus | "All")}
          aria-label="Filter payments by status"
          className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm outline-none focus:border-teal"
        >
          <option value="All">All Statuses</option>
          {PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-deep/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-navy/5 text-left text-xs text-deep uppercase">
              <th className="px-3 py-2">Receipt No.</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Plot</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Method</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <motion.tbody variants={rowList} initial="hidden" animate="show">
            {filtered.map((p) => (
              <motion.tr
                key={p.id}
                variants={rowItem}
                className="border-t border-deep/10"
              >
                <td className="px-3 py-2 font-medium">{p.receiptNumber}</td>
                <td className="px-3 py-2">{p.clientName}</td>
                <td className="px-3 py-2">{p.plotNumber}</td>
                <td className="px-3 py-2">{p.type}</td>
                <td className="px-3 py-2 font-semibold">
                  {formatCurrency(p.amount)}
                </td>
                <td className="px-3 py-2">{p.date}</td>
                <td className="px-3 py-2">{p.method}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={p.status} />
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-sm text-deep/60"
                >
                  No payments match your search.
                </td>
              </tr>
            )}
          </motion.tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-deep/60">
        Showing {filtered.length} of {payments.length} payments
      </p>
    </>
  )
}

/** Animated, searchable list of every agreement. Mounted only while the modal is open. */
function AgreementsBrowser({ agreements }: { agreements: Agreement[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<AgreementStatus | "All">("All")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return agreements.filter(
      (a) =>
        (status === "All" || a.status === status) &&
        (!q ||
          a.agreementNumber.toLowerCase().includes(q) ||
          a.clientName.toLowerCase().includes(q) ||
          a.plotNumber.toLowerCase().includes(q))
    )
  }, [agreements, query, status])

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-52 flex-1">
          <Search
            size={14}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agreement, client, or plot..."
            aria-label="Search agreements"
            className="w-full rounded-lg border border-deep/30 bg-cream py-1.5 pr-3 pl-9 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AgreementStatus | "All")}
          aria-label="Filter agreements by status"
          className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm outline-none focus:border-teal"
        >
          <option value="All">All Statuses</option>
          {AGREEMENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-deep/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-navy/5 text-left text-xs text-deep uppercase">
              <th className="px-3 py-2">Agreement No.</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Plot</th>
              <th className="px-3 py-2">Cemetery</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Date Signed</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <motion.tbody variants={rowList} initial="hidden" animate="show">
            {filtered.map((a) => (
              <motion.tr
                key={a.id}
                variants={rowItem}
                className="border-t border-deep/10"
              >
                <td className="px-3 py-2 font-medium">{a.agreementNumber}</td>
                <td className="px-3 py-2">{a.clientName}</td>
                <td className="px-3 py-2">{a.plotNumber}</td>
                <td className="px-3 py-2">{cemeteryName(a.cemeteryId)}</td>
                <td className="px-3 py-2">{a.type}</td>
                <td className="px-3 py-2">{a.dateSigned}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={a.status} />
                </td>
              </motion.tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-sm text-deep/60"
                >
                  No agreements match your search.
                </td>
              </tr>
            )}
          </motion.tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-deep/60">
        Showing {filtered.length} of {agreements.length} agreements
      </p>
    </>
  )
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="neu-sm px-3 py-2">
      <p className="text-[10px] tracking-wide text-deep uppercase">{label}</p>
      <p className={`text-base font-bold ${tone}`}>{value}</p>
    </div>
  )
}

/** Full payment ledger, opened from the Payment Summary card. */
export function AllPaymentsModal({
  open,
  onClose,
  payments,
}: {
  open: boolean
  onClose: () => void
  payments: Payment[]
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="All Payments"
      description={`${payments.length} transaction${payments.length === 1 ? "" : "s"} across all cemeteries`}
    >
      <PaymentsBrowser payments={payments} />
    </Modal>
  )
}

/** Full agreement ledger, opened from the Agreement Summary card. */
export function AllAgreementsModal({
  open,
  onClose,
  agreements,
}: {
  open: boolean
  onClose: () => void
  agreements: Agreement[]
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="All Agreements"
      description={`${agreements.length} agreement${agreements.length === 1 ? "" : "s"} across all cemeteries`}
    >
      <AgreementsBrowser agreements={agreements} />
    </Modal>
  )
}
