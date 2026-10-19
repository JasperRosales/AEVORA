import { cemeteryName } from "@/components/cemetery-selector"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatCurrency } from "@/lib/format"
import type { Plot } from "@/types/domain"

/** Detail sidebar for the plot selected on the map. */
export function PlotDetailsCard({ plot }: { plot: Plot | null }) {
  return (
    <Card title="Plot Details">
      {plot ? (
        <dl className="space-y-1 text-sm">
          <Row label="Plot Number">
            <span className="font-semibold">{plot.plotNumber}</span>
          </Row>
          <Row label="Cemetery">{cemeteryName(plot.cemeteryId)}</Row>
          <Row label="Section">Section {plot.section}</Row>
          <Row label="Row / Plot">
            {plot.row} / {plot.column}
          </Row>
          <Row label="Burial Type">{plot.type}</Row>
          <Row label="Plot Size">{plot.size}</Row>
          <Row label="Price">{formatCurrency(plot.price)}</Row>
          <Row label="Status">
            <StatusBadge status={plot.status} />
          </Row>
          {plot.reservedFor && <Row label="Reserved For">{plot.reservedFor}</Row>}
          <div className="mt-3 flex gap-2">
            {plot.status === "Available" && (
              <button className="neu-button px-3 py-1.5 text-xs">Reserve Plot</button>
            )}
            {plot.status === "Reserved" && (
              <button className="neu-button px-3 py-1.5 text-xs">
                View Reservation
              </button>
            )}
            {plot.status === "Waiting for Checking" && (
              <button className="neu-button px-3 py-1.5 text-xs">Review Request</button>
            )}
            <button className="neu-button px-3 py-1.5 text-xs">View Details</button>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-deep/70">
          Select a plot on the map to view its details.
        </p>
      )}
    </Card>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt>{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}
