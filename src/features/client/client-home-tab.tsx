import { BadgeCheck, ClipboardList, MapPin } from "lucide-react"
import { motion } from "motion/react"
import { StatusBadge } from "@/components/ui/status-badge"
import { useClientData } from "@/data/client-store"
import { stagger, staggerItem } from "@/lib/motion"
import { Card, ErrorNote, pesos, Spinner } from "./client-ui"

/** Portal landing tab: greeting, headline totals and the next reservation. */
export function HomeTab({
  onBrowsePlots,
  onOpenReservations,
}: {
  onBrowsePlots: () => void
  onOpenReservations: () => void
}) {
  const { status, summary, error } = useClientData()

  if (status === "loading" || status === "idle") return <Spinner />
  if (status === "error")
    return <ErrorNote message={error ?? "Something went wrong."} />

  if (!summary?.client) {
    return (
      <motion.div variants={stagger()} initial="hidden" animate="show">
        <Card>
          <p className="text-sm">
            Your account is not yet linked to a cemetery record. Please visit
            the office or contact support to get registered.
          </p>
        </Card>
      </motion.div>
    )
  }

  const next = summary.nextReservation
  return (
    <motion.div
      variants={stagger(0.06, 0.02)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <Card>
        <p className="text-xs text-deep/60">Welcome back,</p>
        <p className="text-lg font-bold">{summary.client.fullName}</p>
        <p className="text-xs text-deep/60">
          Client ID · {summary.client.clientId}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Reservations" value={String(summary.reservations)} />
        <Stat label="Total paid" value={pesos(summary.totalPaid ?? 0)} />
      </div>

      <Card title="Next reservation">
        {next ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{next.reservation_number}</p>
              <StatusBadge status={next.status} />
            </div>
            <p className="text-sm">
              Plot <span className="font-medium">{next.plot_number}</span> ·{" "}
              {next.plot_category}
            </p>
            <p className="text-sm text-deep/70">Scheduled {next.date}</p>
            <p className="flex items-center gap-1 text-xs text-deep/60">
              <BadgeCheck size={13} className="text-teal" /> {next.verification}
            </p>
          </div>
        ) : (
          <p className="text-sm text-deep/60">No upcoming reservations.</p>
        )}
      </Card>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-2">
        <motion.button
          onClick={onBrowsePlots}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-navy py-3 text-sm font-semibold text-cream transition active:bg-deep"
        >
          <MapPin size={15} /> Find a plot
        </motion.button>
        <motion.button
          onClick={onOpenReservations}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-deep/20 bg-white py-3 text-sm font-semibold text-deep transition active:bg-cream"
        >
          <ClipboardList size={15} /> Reservations
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      variants={staggerItem}
      className="rounded-xl bg-white p-4 shadow-[0_4px_14px_rgba(12,44,85,0.07)]"
    >
      <p className="text-[11px] text-deep/60">{label}</p>
      <p className="text-lg font-bold text-navy">{value}</p>
    </motion.div>
  )
}
