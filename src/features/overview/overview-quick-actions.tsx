import {
  Banknote,
  CalendarCheck,
  CalendarPlus,
  ClipboardCheck,
  FileSignature,
  FileText,
  LayoutGrid,
  Map,
  PieChart,
  Users,
  CreditCard,
  UserPlus,
} from "lucide-react"
import { motion } from "motion/react"
import { Card } from "@/components/ui/card"

const quickActions = [
  { label: "Add Client", icon: UserPlus, desc: "Register a new client record" },
  {
    label: "Add Plot",
    icon: LayoutGrid,
    desc: "Add a new plot to the cemetery",
  },
  {
    label: "View Cemetery Map",
    icon: Map,
    desc: "Open the intteractive cemetery map",
  },
  {
    label: "Create Reservation",
    icon: CalendarPlus,
    desc: "Start a new plot reservation",
  },
  {
    label: "Review Information Checking",
    icon: ClipboardCheck,
    desc: "Verify pending client submissions",
  },
  {
    label: "View Agreements",
    icon: FileSignature,
    desc: "Browse all agreement records",
  },
  {
    label: "Record Payment",
    icon: Banknote,
    desc: "Log a new payment transaction",
  },
  {
    label: "Generate Report",
    icon: FileText,
    desc: "Create and export a report",
  },
]

const reportShortcuts = [
  { label: "Plot Occupancy", icon: PieChart },
  { label: "Reservations", icon: CalendarCheck },
  { label: "Clients", icon: Users },
  { label: "Payments", icon: CreditCard },
  { label: "Agreements", icon: FileSignature },
  { label: "Information Checking", icon: ClipboardCheck },
]

const pressSpring = { type: "spring", stiffness: 420, damping: 26 } as const

export function QuickActionsCard() {
  return (
    <Card title="Quick Actions">
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map(({ label, icon: Icon, desc }) => (
          <div key={label} className="group relative">
            <motion.button
              aria-label={label}
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
        ))}
      </div>
    </Card>
  )
}

export function ReportsCard() {
  return (
    <Card title="Reports and Analytics">
      <div className="grid grid-cols-3 grid-rows-2 gap-3">
        {reportShortcuts.map(({ label, icon: Icon }) => (
          <motion.button
            key={label}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            transition={pressSpring}
            className="neu-button flex aspect-square flex-col items-center justify-center gap-2 p-2"
          >
            <Icon size={20} className="text-deep" />
            <span className="text-center text-[11px] leading-tight font-medium">
              {label}
            </span>
          </motion.button>
        ))}
      </div>
    </Card>
  )
}
