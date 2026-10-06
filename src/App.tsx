import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Header } from "@/components/layout/header"
import { Sidebar, type Page } from "@/components/layout/sidebar"
import { AgreementsPage } from "@/features/agreements/agreements-page"
import { ClientsPage } from "@/features/clients/clients-page"
import { CemeteryMapPage } from "@/features/map/cemetery-map-page"
import { OverviewPage } from "@/features/overview/overview-page"
import { PaymentsPage } from "@/features/payments/payments-page"
import { PlotsPage } from "@/features/plots/plots-page"
import { ReportsPage } from "@/features/reports/reports-page"
import { ReservationsPage } from "@/features/reservations/reservations-page"

export default function App() {
  const [page, setPage] = useState<Page>("Overview")

  return (
    <div className="flex min-h-svh">
      <Sidebar active={page} onNavigate={setPage} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header title={page} />
        <main className="flex-1 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
          {page === "Overview" && <OverviewPage />}
          {page === "Cemetery Map" && <CemeteryMapPage />}
          {page === "Plots" && <PlotsPage />}
          {page === "Reservations" && <ReservationsPage />}
          {page === "Clients" && <ClientsPage />}
          {page === "Payments" && <PaymentsPage />}
          {page === "Agreements" && <AgreementsPage />}
          {page === "Reports" && <ReportsPage />}
          </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
