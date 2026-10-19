import {
  CalendarCheck,
  CheckCircle,
  Clock,
  Home,
  LayoutGrid,
} from "lucide-react"
import { motion } from "motion/react"
import { KpiTile } from "@/components/ui/kpi-tile"
import { countByStatus } from "@/lib/format"
import { stagger } from "@/lib/motion"
import type { Plot } from "@/types/domain"

/** Headline plot metrics for the currently selected cemetery. */
export function OverviewKpis({ plots }: { plots: Plot[] }) {
  const counts = countByStatus(plots)

  return (
    <motion.div
      variants={stagger(0.06, 0.05)}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
    >
      {(
        [
          {
            label: "Total Plots",
            value: plots.length,
            icon: LayoutGrid,
            trend: { up: false, text: "6%" },
          },
          {
            label: "Available",
            value: counts["Available"] ?? 0,
            icon: CheckCircle,
            trend: { up: true, text: "2%" },
          },
          {
            label: "Reserved",
            value: counts["Reserved"] ?? 0,
            icon: CalendarCheck,
            trend: { up: true, text: "3%" },
          },
          {
            label: "Occupied",
            value: counts["Occupied"] ?? 0,
            icon: Home,
            trend: { up: false, text: "4%" },
          },
          {
            label: "Waiting for Checking",
            value: counts["Waiting for Checking"] ?? 0,
            icon: Clock,
            trend: { up: true, text: "5%" },
          },
        ] as const
      ).map(({ label, value, icon, trend }) => (
        <KpiTile
          key={label}
          label={label}
          value={value}
          icon={icon}
          trend={trend}
        />
      ))}
    </motion.div>
  )
}
