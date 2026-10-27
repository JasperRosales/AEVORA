import { useState } from "react"
import { cemeteryName } from "@/components/cemetery-selector"
import { Modal } from "@/components/ui/modal"
import { StatusBadge } from "@/components/ui/status-badge"
import { updateReservationRow } from "@/data/store"
import { updateReservation } from "@/lib/neon-api"
import type { Reservation } from "@/types/domain"

const LABEL = "mb-1 block text-xs font-medium text-deep"
const INPUT =
  "w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
const PRIMARY =
  "rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
const GHOST = "neu-button px-4 py-2 text-sm"

const RESERVATION_STATUSES: Reservation["status"][] = [
  "Pending",
  "Under Verification",
  "Confirmed",
  "Cancelled",
]

const VERIFICATIONS: Reservation["verification"][] = [
  "Waiting for Checking",
  "Under Review",
  "Verified",
  "Requires Action",
]

/**
 * Reservation record dialog used by the Overview tables and the cemetery map.
 *
 * `view` opens on the read-only summary; `review` opens straight into the
 * information-checking form. Both modes can switch to the form, so staff can
 * read the record and then verify it without leaving the page. Saving updates
 * the reservation row in Postgres and mirrors it into the shared store, which
 * refreshes the table/list behind the dialog.
 */
export function ReservationDetailsModal({
  reservation,
  mode,
  onClose,
  onUpdated,
}: {
  reservation: Reservation
  mode: "view" | "review"
  onClose: () => void
  onUpdated: (message: string) => void
}) {
  const [reviewing, setReviewing] = useState(mode === "review")
  const [status, setStatus] = useState<Reservation["status"]>(reservation.status)
  const [verification, setVerification] = useState<Reservation["verification"]>(
    reservation.verification
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (status === reservation.status && verification === reservation.verification) {
      onClose()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated = await updateReservation(reservation.id, {
        status,
        verification,
      })
      updateReservationRow(updated)
      onUpdated(
        `Reservation ${updated.reservationNumber} updated — ${updated.status} · ${updated.verification}.`
      )
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Reservation ${reservation.reservationNumber}`}
      description={`${reservation.clientName} · Plot ${reservation.plotNumber} · ${cemeteryName(reservation.cemeteryId)}`}
      footer={
        <>
          <span className="hidden sm:inline">
            Reservation {reservation.reservationNumber}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={GHOST}>
              Close
            </button>
            {reviewing ? (
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy}
                className={PRIMARY}
              >
                {busy ? "Saving..." : "Save review"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setReviewing(true)}
                className={PRIMARY}
              >
                Review information
              </button>
            )}
          </div>
        </>
      }
    >
      <div className="space-y-3">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Client
            </dt>
            <dd className="font-medium">{reservation.clientName}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Plot
            </dt>
            <dd className="font-medium">{reservation.plotNumber}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Cemetery
            </dt>
            <dd className="font-medium">
              {cemeteryName(reservation.cemeteryId)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Schedule date
            </dt>
            <dd className="font-medium">{reservation.date}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Burial type
            </dt>
            <dd className="font-medium">{reservation.burialType}</dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Reservation status
            </dt>
            <dd>
              <StatusBadge status={reservation.status} />
            </dd>
          </div>
          <div>
            <dt className="text-[10px] tracking-wide text-deep/50 uppercase">
              Information checking
            </dt>
            <dd>
              <StatusBadge status={reservation.verification} />
            </dd>
          </div>
        </dl>

        {reviewing && (
          <div className="space-y-3 rounded-xl border border-deep/10 bg-cream/60 p-3">
            <p className="text-xs text-deep/60">
              Set <strong>Verified</strong> when the documents check out. Use{" "}
              <strong>Requires Action</strong> to send the request back to the
              family.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL} htmlFor="review-reservation-status">
                  Reservation status
                </label>
                <select
                  id="review-reservation-status"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Reservation["status"])
                  }
                  className={INPUT}
                >
                  {RESERVATION_STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL} htmlFor="review-verification">
                  Information checking
                </label>
                <select
                  id="review-verification"
                  value={verification}
                  onChange={(e) =>
                    setVerification(
                      e.target.value as Reservation["verification"]
                    )
                  }
                  className={INPUT}
                >
                  {VERIFICATIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
