import { CheckCircle2, Lock } from "lucide-react"
import { useState, type FormEvent } from "react"
import { motion } from "motion/react"
import { Modal } from "@/components/ui/modal"
import { StatusBadge } from "@/components/ui/status-badge"
import { reloadClientData, useClientData } from "@/data/client-store"
import {
  PAYMENT_METHODS,
  PAYMENT_TYPES,
  createClientPayment,
  type ClientPayment,
  type ClientReservation,
} from "@/lib/client-api"
import { EASE_OUT } from "@/lib/motion"
import { ErrorNote, pesos } from "./client-ui"

const LABEL =
  "mb-1 block text-[11px] font-semibold tracking-wide text-deep/60 uppercase"
const INPUT =
  "w-full rounded-xl border border-deep/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"

type PaymentType = (typeof PAYMENT_TYPES)[number]
type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/**
 * What this family has already committed to a plot: payments already marked
 * Paid plus ones still waiting for the office. Pending counts because it is
 * money the family believes is on its way — subtracting it stops a double
 * payment while a submission is being verified.
 */
export function paidToward(
  reservation: Pick<ClientReservation, "plot_number" | "cemetery">,
  payments: ClientPayment[]
): number {
  return payments
    .filter(
      (p) =>
        p.plot_number === reservation.plot_number &&
        p.cemetery === reservation.cemetery &&
        p.status !== "Overdue"
    )
    .reduce((sum, p) => sum + p.amount, 0)
}

export function balanceFor(
  reservation: Pick<ClientReservation, "plot_number" | "cemetery" | "price">,
  payments: ClientPayment[]
): number {
  return Math.max(0, reservation.price - paidToward(reservation, payments))
}

/** A sensible starting amount for each payment type. */
function suggestedAmount(type: PaymentType, balance: number): number {
  switch (type) {
    case "Full Payment":
      return balance
    case "Down Payment":
      return Math.max(1, Math.round(balance / 2))
    case "Installment":
      return Math.max(1, Math.round(balance / 4))
    default:
      return Math.min(5000, balance)
  }
}

/**
 * Mobile payment sheet. Submits against one of the family's own reservations;
 * the server files it as Pending until the office confirms receipt. Rendered
 * only while a reservation is selected, so every opening starts fresh.
 */
export function PaymentSheet({
  reservation,
  onClose,
  onViewPayments,
}: {
  reservation: ClientReservation
  onClose: () => void
  onViewPayments?: () => void
}) {
  const { payments } = useClientData()
  const balance = balanceFor(reservation, payments)
  const [type, setType] = useState<PaymentType>("Reservation Fee")
  const [amount, setAmount] = useState(() =>
    String(suggestedAmount("Reservation Fee", balance))
  )
  const [method, setMethod] = useState<PaymentMethod>("Online")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<ClientPayment | null>(null)

  function chooseType(next: PaymentType) {
    setType(next)
    // Re-quote whenever the type changes; the family can still edit the field.
    setAmount(String(suggestedAmount(next, balance)))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createClientPayment({
        reservationId: reservation.id,
        type,
        amount: Number(amount),
        method,
        date: new Date().toISOString().slice(0, 10),
      })
      setReceipt(created)
      reloadClientData()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (receipt) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Payment submitted"
        description={`Reservation ${reservation.reservation_number}`}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
          className="space-y-4"
        >
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircle2 size={44} className="text-green-600" />
            <p className="text-lg font-bold">{pesos(receipt.amount)}</p>
            <p className="text-xs text-deep/60">
              Receipt {receipt.receipt_number} · {receipt.method}
            </p>
            <StatusBadge status={receipt.status} />
          </div>

          <p className="rounded-xl bg-cream px-3 py-2.5 text-xs text-deep/70">
            The office will confirm your payment. Until then it shows as{" "}
            <span className="font-semibold">Pending</span> in your Payments tab
            — you can upload proof of payment on the reservation.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-deep/20 py-2.5 text-sm font-semibold text-deep/70 transition active:bg-cream"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => {
                onViewPayments?.()
                onClose()
              }}
              className="rounded-xl bg-navy py-2.5 text-sm font-semibold text-cream transition active:bg-deep"
            >
              View payments
            </button>
          </div>
        </motion.div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Pay plot ${reservation.plot_number}`}
      description={`${reservation.cemetery} · Reservation ${reservation.reservation_number}`}
    >
      <form onSubmit={submit} className="space-y-3">
        {error && <ErrorNote message={error} />}

        <div className="rounded-xl bg-cream px-3 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-deep/60">Plot price</span>
            <span className="text-sm font-semibold">
              {pesos(reservation.price)}
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-xs text-deep/60">Already committed</span>
            <span className="text-sm font-semibold">
              {pesos(reservation.price - balance)}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2 border-t border-deep/10 pt-2">
            <span className="text-xs font-semibold text-deep">Balance</span>
            <span className="text-lg font-bold text-navy">
              {pesos(balance)}
            </span>
          </div>
        </div>

        {balance === 0 ? (
          <p className="rounded-xl bg-green-50 px-3 py-2.5 text-sm text-green-800">
            This plot is fully settled — no payment is due.
          </p>
        ) : (
          <>
            <div>
              <label className={LABEL} htmlFor="payment-type">
                Payment type
              </label>
              <select
                id="payment-type"
                value={type}
                onChange={(e) => chooseType(e.target.value as PaymentType)}
                className={INPUT}
              >
                {PAYMENT_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL} htmlFor="payment-amount">
                Amount (₱)
              </label>
              <input
                id="payment-amount"
                type="number"
                inputMode="numeric"
                min={1}
                max={balance}
                step={1}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={INPUT}
              />
              <p className="mt-1 text-[11px] text-deep/50">
                You can pay part of the balance now and the rest later.
              </p>
            </div>

            <div>
              <label className={LABEL} htmlFor="payment-method">
                Method
              </label>
              <select
                id="payment-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className={INPUT}
              >
                {PAYMENT_METHODS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <p className="flex items-start gap-1.5 text-[11px] text-deep/50">
              <Lock size={12} className="mt-0.5 shrink-0" />
              Your submission is saved against this reservation and marked
              Pending until the office confirms the payment.
            </p>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-cream transition active:bg-deep disabled:opacity-60"
            >
              {busy ? "Submitting..." : `Pay ${pesos(Number(amount) || 0)}`}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-1 text-xs font-medium text-deep/60 transition hover:text-deep"
            >
              I&apos;ll pay later
            </button>
          </>
        )}
      </form>
    </Modal>
  )
}
