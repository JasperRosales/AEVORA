import { useMemo, useState } from "react"
import { CemeterySelector, cemeteryName } from "@/components/cemetery-selector"
import { Card } from "@/components/ui/card"
import { useData } from "@/data/store"
import { NotificationsCard, RecentActivityCard } from "./overview-info-cards"
import { OverviewKpis } from "./overview-kpis"
import { OccupancyCard } from "./overview-occupancy"
import { PendingChecksCard, RecentReservationsCard } from "./overview-record-tables"
import { QuickActionsCard, ReportsCard } from "./overview-quick-actions"
import { AgreementSummaryCard, PaymentSummaryCard } from "./overview-summary-cards"

/**
 * Staff dashboard landing page. Owns the cemetery filter and composes the
 * section cards, each living in its own overview-* module.
 */
export function OverviewPage() {
  const { activities, agreements, notifications, payments, plots, reservations } = useData()
  const [cemeteryId, setCemeteryId] = useState("all")

  const filteredPlots = useMemo(
    () =>
      cemeteryId === "all" ? plots : plots.filter((p) => p.cemeteryId === cemeteryId),
    [cemeteryId, plots],
  )

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Good morning, Admin Kyle</h2>
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

      <OverviewKpis plots={filteredPlots} />

      <div className="grid gap-4 lg:grid-cols-2">
        <OccupancyCard plots={filteredPlots} />
        <QuickActionsCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentReservationsCard reservations={reservations} />
        <PendingChecksCard reservations={reservations} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <PaymentSummaryCard payments={payments} />
        <AgreementSummaryCard agreements={agreements} />
        <NotificationsCard notifications={notifications} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RecentActivityCard activities={activities} />
        <ReportsCard />
      </div>
    </div>
  )
}
