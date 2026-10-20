import { useEffect, useState } from "react"
import {
  Banknote,
  CalendarCheck,
  CalendarPlus,
  ClipboardCheck,
  CreditCard,
  FileSignature,
  FileText,
  LayoutGrid,
  Map,
  PieChart,
  UserPlus,
  Users,
} from "lucide-react"
import { motion } from "motion/react"
import type { Page } from "@/components/layout/sidebar"
import { Card } from "@/components/ui/card"
import { insertReport } from "@/data/store"
import type { DashboardProps } from "@/features/lazy-routes"
import { createReport } from "@/lib/neon-api"
import {
  AddClientModal,
  AddPlotModal,
  CreateReservationModal,
  GenerateReportModal,
  RecordPaymentModal,
  type ReportType,
} from "./overview-action-modals"

/** What a quick-action tile does: open a form, or jump to another screen. */
type Action =
  { kind: "modal"; modal: ModalKey } | { kind: "navigate"; page: Page }

type ModalKey = "client" | "plot" | "reservation" | "payment" | "report"

const quickActions: {
  label: string
  icon: typeof Map
  desc: string
  action: Action
}[] = [
  {
    label: "Add Client",
    icon: UserPlus,
    desc: "Register a new client record",
    action: { kind: "modal", modal: "client" },
  },
  {
    label: "Add Plot",
    icon: LayoutGrid,
    desc: "Add a new plot to the cemetery",
    action: { kind: "modal", modal: "plot" },
  },
  {
    label: "View Cemetery Map",
    icon: Map,
    desc: "Open the interactive cemetery map",
    action: { kind: "navigate", page: "Cemetery Map" },
  },
  {
    label: "Create Reservation",
    icon: CalendarPlus,
    desc: "Start a new plot reservation",
    action: { kind: "modal", modal: "reservation" },
  },
  {
    label: "Review Information Checking",
    icon: ClipboardCheck,
    desc: "Verify pending client submissions",
    action: { kind: "navigate", page: "Reservations" },
  },
  {
    label: "View Agreements",
    icon: FileSignature,
    desc: "Browse all agreement records",
    action: { kind: "navigate", page: "Agreements" },
  },
  {
    label: "Record Payment",
    icon: Banknote,
    desc: "Log a new payment transaction",
    action: { kind: "modal", modal: "payment" },
  },
  {
    label: "Generate Report",
    icon: FileText,
    desc: "Create and export a report",
    action: { kind: "modal", modal: "report" },
  },
]

/** Report tiles: labels are the same types the reports API accepts. */
const reportShortcuts: { label: ReportType; icon: typeof PieChart }[] = [
  { label: "Plot Occupancy", icon: PieChart },
  { label: "Reservations", icon: CalendarCheck },
  { label: "Clients", icon: Users },
  { label: "Payments", icon: CreditCard },
  { label: "Agreements", icon: FileSignature },
  { label: "Information Checking", icon: ClipboardCheck },
]

const pressSpring = { type: "spring", stiffness: 420, damping: 26 } as const

type Notice = { tone: "ok" | "error"; text: string }

export function QuickActionsCard({ onNavigate, onPrefetch }: DashboardProps) {
  const [modal, setModal] = useState<ModalKey | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  // Confirmations clear themselves so the card header returns to rest.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 6000)
    return () => clearTimeout(timer)
  }, [notice])

  function run(action: Action) {
    if (action.kind === "modal") {
      setModal(action.modal)
      return
    }
    onPrefetch?.(action.page)
    onNavigate?.(action.page)
  }

  /** Modal success hook: close the dialog and flag the new record. */
  function created(text: string) {
    setModal(null)
    setNotice({ tone: "ok", text })
  }

  const closeModal = () => setModal(null)

  return (
    <Card
      title="Quick Actions"
      action={
        notice && (
          <span
            role="status"
            className={`text-right text-xs font-medium ${
              notice.tone === "ok" ? "text-teal" : "text-red-600"
            }`}
          >
            {notice.text}
          </span>
        )
      }
    >
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map(({ label, icon: Icon, desc, action }) => {
          const target = action.kind === "navigate" ? action.page : null
          return (
            <div key={label} className="group relative">
              <motion.button
                type="button"
                aria-label={label}
                onClick={() => run(action)}
                onMouseEnter={() => target && onPrefetch?.(target)}
                onFocus={() => target && onPrefetch?.(target)}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                transition={pressSpring}
                className="neu-button flex aspect-square w-full flex-col items-center justify-center gap-2 p-2"
              >
                <Icon
                  size={20}
                  className="text-deep transition-transform duration-200 group-hover:scale-110"
                />
                <span className="text-center text-[11px] leading-tight font-medium">
                  {label}
                </span>
              </motion.button>
              <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-md bg-navy px-2 py-1 text-[11px] whitespace-nowrap text-cream opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {desc}
              </span>
            </div>
          )
        })}
      </div>

      {modal === "client" && (
        <AddClientModal open onClose={closeModal} onCreated={created} />
      )}
      {modal === "plot" && (
        <AddPlotModal open onClose={closeModal} onCreated={created} />
      )}
      {modal === "reservation" && (
        <CreateReservationModal open onClose={closeModal} onCreated={created} />
      )}
      {modal === "payment" && (
        <RecordPaymentModal open onClose={closeModal} onCreated={created} />
      )}
      {modal === "report" && (
        <GenerateReportModal
          open
          onClose={closeModal}
          onCreated={(text) => {
            created(text)
            onNavigate?.("Reports")
          }}
        />
      )}
    </Card>
  )
}

export function ReportsCard({ onNavigate }: DashboardProps) {
  const [busy, setBusy] = useState<ReportType | null>(null)
  const [error, setError] = useState<string | null>(null)

  /** Generates the report record, then opens the Reports log to show it. */
  async function generate(type: ReportType) {
    if (busy) return
    setBusy(type)
    setError(null)
    try {
      insertReport(await createReport({ type, name: `${type} Report` }))
      onNavigate?.("Reports")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card
      title="Reports and Analytics"
      action={
        error && (
          <span
            role="status"
            className="text-right text-xs font-medium text-red-600"
          >
            {error}
          </span>
        )
      }
    >
      <div className="grid grid-cols-3 grid-rows-2 gap-3">
        {reportShortcuts.map(({ label, icon: Icon }) => (
          <motion.button
            key={label}
            type="button"
            aria-label={`Generate ${label} report`}
            disabled={busy !== null}
            onClick={() => generate(label)}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={pressSpring}
            className="neu-button flex aspect-square flex-col items-center justify-center gap-2 p-2 disabled:opacity-60"
          >
            <Icon
              size={20}
              className={`text-deep transition-transform duration-200 ${
                busy === label ? "animate-pulse" : ""
              }`}
            />
            <span className="text-center text-[11px] leading-tight font-medium">
              {label}
            </span>
          </motion.button>
        ))}
      </div>
    </Card>
  )
}
