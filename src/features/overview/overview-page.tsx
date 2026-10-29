import { useMemo, useState } from "react"
import { motion } from "motion/react"
import { CemeterySelector, cemeteryName } from "@/components/cemetery-selector"
import { Card } from "@/components/ui/card"
import { useData } from "@/data/store"
import type { DashboardProps } from "@/features/lazy-routes"
import { ReservationDetailsModal } from "@/features/shared/reservation-review-modal"
import { fadeUp, stagger } from "@/lib/motion"
import type { Reservation } from "@/types/domain"
import { RecentActivityCard } from "./overview-info-cards"
import { OverviewKpis } from "./overview-kpis"
import { OccupancyCard } from "./overview-occupancy"
import {
  PendingChecksCard,
  RecentReservationsCard,
} from "./overview-record-tables"
import { QuickActionsCard, ReportsCard } from "./overview-quick-actions"
import {
  AgreementSummaryCard,
  PaymentSummaryCard,
} from "./overview-summary-cards"

/**
 * Staff dashboard landing page. Owns the cemetery filter and composes the
 * section cards, each living in its own overview-* module. The quick-action
 * cards receive the shell's navigation so their tiles can switch screens.
 */
export function OverviewPage({ onNavigate, onPrefetch }: DashboardProps) {
  const { activities, agreements, payments, plots, reservations } = useData()
  const [cemeteryId, setCemeteryId] = useState("all")
  const [reservationModal, setReservationModal] = useState<{
    reservation: Reservation
    mode: "view" | "review"
  } | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const filteredPlots = useMemo(
    () =>
      cemeteryId === "all"
        ? plots
        : plots.filter((p) => p.cemeteryId === cemeteryId),
    [cemeteryId, plots]
  )

  return (
    <motion.div
      variants={stagger(0.07, 0.04)}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={fadeUp}>
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Good morning, Admin Kyle
              </h2>
              <p className="text-sm text-deep">
                Here is the current status of {cemeteryName(cemeteryId)}. All
                systems are operational.
              </p>
              <p className="text-xs text-deep/70">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <CemeterySelector value={cemeteryId} onChange={setCemeteryId} />
          </div>
        </Card>
      </motion.div>

      {notice && (
        <motion.div
          variants={fadeUp}
          className="flex items-start justify-between gap-3 rounded-xl bg-teal/20 px-4 py-3 text-sm text-deep"
        >
          <p>{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 text-xs font-semibold underline-offset-2 hover:underline"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      <motion.div variants={fadeUp}>
        <OverviewKpis plots={filteredPlots} />
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-2">
        <OccupancyCard plots={filteredPlots} />
        <QuickActionsCard onNavigate={onNavigate} onPrefetch={onPrefetch} />
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-2">
        <RecentReservationsCard
          reservations={reservations}
          onView={(reservation) =>
            setReservationModal({ reservation, mode: "view" })
          }
        />
        <PendingChecksCard
          reservations={reservations}
          onReview={(reservation) =>
            setReservationModal({ reservation, mode: "review" })
          }
        />
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2">
        <PaymentSummaryCard payments={payments} />
        <AgreementSummaryCard agreements={agreements} />
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 lg:grid-cols-2">
        <RecentActivityCard activities={activities} />
        <ReportsCard />
      </motion.div>

      {reservationModal && (
        <ReservationDetailsModal
          key={`${reservationModal.reservation.id}-${reservationModal.mode}`}
          reservation={reservationModal.reservation}
          mode={reservationModal.mode}
          onClose={() => setReservationModal(null)}
          onUpdated={(message) => setNotice(message)}
        />
      )}
    </motion.div>
  )
}
