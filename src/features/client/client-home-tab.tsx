import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  Wallet,
} from "lucide-react"
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
  const { status, summary, reservations, payments, error } = useClientData()

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
  const clientName =
    summary.client.fullName?.trim() || summary.profile?.name?.trim() || "Client"
  const seenPlots = new Set<string>()
  const activeReservations = reservations
    .filter((reservation) => reservation.status !== "Cancelled")
    .filter((reservation) => {
      const key = `${reservation.cemetery}|${reservation.plot_number}`
      if (seenPlots.has(key)) return false
      seenPlots.add(key)
      return true
    })
  const pendingPayments = payments
    .filter((payment) => payment.status === "Pending")
    .reduce((total, payment) => total + payment.amount, 0)
  const featuredReservation = activeReservations
    .slice()
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))[0]

  return (
    <motion.div
      variants={stagger(0.06, 0.02)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <section className="overflow-hidden rounded-2xl bg-navy p-5 text-cream shadow-[0_8px_24px_rgba(6,22,51,0.18)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-cream/60 uppercase">
              Client dashboard
            </p>
            <p className="mt-4 text-sm text-cream/75">Welcome back</p>
            <h1 className="mt-0.5 truncate text-2xl font-semibold tracking-tight text-white">
              {clientName}
            </h1>
          </div>
          <div className="shrink-0 rounded-xl border border-cream/15 bg-cream px-3 py-2 text-right"></div>
        </div>
        <p className="mt-4 border-t border-cream/15 pt-3 text-xs text-cream/65">
          Your reservations and account activity in one place.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Pending payments"
          value={pesos(pendingPayments)}
          icon={Wallet}
        />
        <Stat
          label="Reservations"
          value={
            featuredReservation
              ? `Plot ${featuredReservation.plot_number}`
              : String(summary.reservations)
          }
          detail={
            featuredReservation
              ? `${featuredReservation.cemetery} · ${featuredReservation.location}`
              : "No active reservations"
          }
          icon={CalendarDays}
        />
      </div>

      <Card title="Next reservation">
        {next ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-deep/50 uppercase">
                  Reservation reference
                </p>
                <p className="mt-0.5 font-semibold text-navy">
                  {next.reservation_number}
                </p>
              </div>
              <StatusBadge status={next.status} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 border-t border-deep/10 pt-3">
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-deep/50 uppercase">
                  Plot
                </p>
                <p className="mt-0.5 text-sm font-medium">{next.plot_number}</p>
                <p className="text-[11px] text-deep/60">{next.plot_category}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-deep/50 uppercase">
                  Scheduled
                </p>
                <p className="mt-0.5 text-sm font-medium">{next.date}</p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-deep/60">
                  <BadgeCheck size={12} className="text-teal" />
                  {next.verification}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-cream/70 px-3 py-3">
            <p className="text-sm font-medium text-deep">
              No upcoming reservations
            </p>
            <p className="mt-1 text-xs text-deep/60">
              Your next reservation will appear here.
            </p>
          </div>
        )}
      </Card>

      <motion.div variants={staggerItem} className="grid grid-cols-2 gap-2">
        <motion.button
          onClick={onBrowsePlots}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="client-primary-button flex items-center justify-center gap-1.5 py-3 text-sm font-semibold"
        >
          Find a plot <ArrowRight size={15} />
        </motion.button>
        <motion.button
          onClick={onOpenReservations}
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="neu-button flex items-center justify-center gap-1.5 px-2 py-3 text-sm font-semibold text-deep"
        >
          <ClipboardList size={15} /> Reservations
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

function Stat({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail?: string
  icon: typeof CalendarDays
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="rounded-2xl border border-deep/10 bg-white p-4 shadow-[0_4px_14px_rgba(12,44,85,0.06)]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-deep/60">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-cream text-deep">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-2 truncate text-xl font-bold tracking-tight text-navy">
        {value}
      </p>
      {detail && (
        <p className="mt-1 truncate text-[11px] leading-4 text-deep/60">
          {detail}
        </p>
      )}
    </motion.div>
  )
}
