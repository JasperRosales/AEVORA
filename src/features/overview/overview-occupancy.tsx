import { Card } from "@/components/ui/card"
import { DonutChart } from "@/components/ui/donut-chart"
import { countByStatus } from "@/lib/format"
import type { Plot } from "@/types/domain"

/** Donut chart + occupancy bar for the filtered plots. */
export function OccupancyCard({ plots }: { plots: Plot[] }) {
  const counts = countByStatus(plots)

  const occupancy = plots.length
    ? Math.round(((counts["Occupied"] ?? 0) / plots.length) * 100) +
      Math.round(((counts["Reserved"] ?? 0) / plots.length) * 100)
    : 0

  return (
    <Card title="Plot Occupancy Overview">
      <DonutChart
        centerLabel={`${occupancy}%`}
        segments={[
          { label: "Available", value: counts["Available"] ?? 0, color: "#16a34a" },
          { label: "Reserved", value: counts["Reserved"] ?? 0, color: "#2563eb" },
          { label: "Occupied", value: counts["Occupied"] ?? 0, color: "#dc2626" },
          { label: "Waiting", value: counts["Waiting for Checking"] ?? 0, color: "#eab308", opacity: 1 },
        ]}
      />
      <div className="mt-3 border-t border-deep/15 pt-3">
        <p className="text-sm">
          <strong className="text-lg">{plots.length}</strong> total plots
        </p>
        <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-navy/10">
          <span className="bg-teal" style={{ width: `${occupancy}%` }} />
        </div>
        <p className="mt-1 text-xs text-deep">Occupancy rate {occupancy}%</p>
      </div>
    </Card>
  )
}
