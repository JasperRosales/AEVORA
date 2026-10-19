import { cemeteryName } from "@/components/cemetery-selector"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import type { Reservation } from "@/types/domain"

/** Latest five reservations in a compact table. */
export function RecentReservationsCard({ reservations }: { reservations: Reservation[] }) {
  return (
    <Card title="Recent Reservations">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>No.</th>
              <th>Client</th>
              <th>Cemetery</th>
              <th>Plot</th>
              <th>Date</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reservations.slice(0, 5).map((r) => (
              <tr key={r.id} className="border-t border-deep/10">
                <td className="py-1.5">{r.reservationNumber}</td>
                <td>{r.clientName}</td>
                <td>{cemeteryName(r.cemeteryId)}</td>
                <td>{r.plotNumber}</td>
                <td>{r.date}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>
                  <button className="neu-button px-2.5 py-1 text-[11px]">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/** Reservations still awaiting verification. */
export function PendingChecksCard({ reservations }: { reservations: Reservation[] }) {
  const pendingChecks = reservations.filter((r) => r.verification !== "Verified")

  return (
    <Card title="Information Checking">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Client</th>
              <th>Reference</th>
              <th>Submitted</th>
              <th>Verification</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {pendingChecks.map((r) => (
              <tr key={r.id} className="border-t border-deep/10">
                <td className="py-1.5">{r.clientName}</td>
                <td>{r.reservationNumber}</td>
                <td>{r.date}</td>
                <td>
                  <StatusBadge status={r.verification} />
                </td>
                <td>
                  <button className="neu-button px-2.5 py-1 text-[11px]">Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
