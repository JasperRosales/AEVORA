import { CreditCard } from "lucide-react"
import { motion } from "motion/react"
import { StatusBadge } from "@/components/ui/status-badge"
import { useClientData } from "@/data/client-store"
import { stagger, staggerItem } from "@/lib/motion"
import { balanceFor } from "./client-payment-sheet"
import { Card, ErrorNote, pesos, Spinner } from "./client-ui"

/** Payment history tab, with a nudge when a reservation still has a balance. */
export function PaymentsTab({
  onOpenReservations,
}: {
  onOpenReservations: () => void
}) {
  const { status, payments, reservations, error } = useClientData()

  if (status === "loading" || status === "idle") return <Spinner />
  if (status === "error")
    return <ErrorNote message={error ?? "Something went wrong."} />

  // A plot can appear in several historical reservations; count its balance
  // once — the newest non-cancelled row, since the list is date-descending.
  const seenPlots = new Set<string>()
  const currentPlots = reservations
    .filter((r) => r.status !== "Cancelled")
    .filter((r) => {
      const key = `${r.cemetery}|${r.plot_number}`
      if (seenPlots.has(key)) return false
      seenPlots.add(key)
      return true
    })
  const outstanding = currentPlots.reduce(
    (sum, r) => sum + balanceFor(r, payments),
    0
  )

  return (
    <motion.div
      variants={stagger(0.05, 0.02)}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {outstanding > 0 && (
        <Card>
          <p className="text-[11px] tracking-wide text-deep/60 uppercase">
            Balance due
          </p>
          <p className="text-xl font-bold text-navy">{pesos(outstanding)}</p>
          <p className="text-xs text-deep/60">
            Across your current reservations. Payments you submit show as
            Pending until the office confirms them.
          </p>
          <motion.button
            variants={staggerItem}
            onClick={onOpenReservations}
            whileTap={{ scale: 0.98 }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-navy py-2.5 text-sm font-semibold text-cream transition active:bg-deep"
          >
            <CreditCard size={15} /> Make a payment
          </motion.button>
        </Card>
      )}

      {payments.length === 0 ? (
        <Card>
          <p className="text-sm text-deep/70">No payments on record yet.</p>
        </Card>
      ) : (
        payments.map((p, i) => (
          <Card key={`${p.receipt_number}-${i}`}>
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{p.receipt_number}</p>
              <StatusBadge status={p.status} />
            </div>
            <p className="mt-1 text-lg font-bold text-navy">
              {pesos(p.amount)}
            </p>
            <p className="text-sm">
              {p.type} · Plot {p.plot_number}
            </p>
            <p className="text-xs text-deep/60">
              {p.cemetery} · {p.method} · {p.date}
            </p>
          </Card>
        ))
      )}
    </motion.div>
  )
}
