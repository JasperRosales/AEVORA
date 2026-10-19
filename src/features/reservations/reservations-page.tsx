import { CheckCircle, Clock, Paperclip, Search, Upload, XCircle } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { cemeteryName } from "@/components/cemetery-selector"
import { addAttachment, loadAttachments, useData } from "@/data/store"
import { usePagination } from "@/lib/use-pagination"
import type { Reservation } from "@/types/domain"

/** Attachment upload/list backed by Neon Object Storage (the `assets` bucket). */
function ReservationFiles({ reservation }: { reservation: Reservation }) {
  const { attachments } = useData()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const rows = attachments.filter((a) => a.reservationId === reservation.id)

  useEffect(() => {
    setBusy(true)
    setError(null)
    loadAttachments(reservation.id)
      .catch((err) => setError(String(err)))
      .finally(() => setBusy(false))
  }, [reservation.id])

  async function onUpload(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await addAttachment(reservation.id, file)
    } catch (err) {
      setError(String(err))
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-deep/15 bg-cream/60 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Paperclip size={14} className="text-deep" />
        <p className="text-sm font-medium">
          Files — {reservation.reservationNumber} ({reservation.clientName})
        </p>
        <label className="neu-button ml-auto inline-flex cursor-pointer items-center gap-1 px-3 py-1 text-xs">
          <Upload size={12} /> {busy ? "Working..." : "Upload file"}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            disabled={busy}
            onChange={(e) => onUpload(e.target.files?.[0])}
          />
        </label>
      </div>
      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
      {rows.length === 0 ? (
        <p className="text-xs text-deep/60">
          {busy ? "Loading..." : "No files yet — uploaded documents are stored in Neon Object Storage."}
        </p>
      ) : (
        <ul className="space-y-1">
          {rows.map((a) => (
            <li key={a.id} className="flex items-center gap-3 text-xs">
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="text-navy underline-offset-2 hover:underline"
              >
                {a.filename}
              </a>
              <span className="text-deep/60">{Math.max(1, Math.round(a.size / 1024))} KB</span>
              <span className="text-deep/40">{new Date(a.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ReservationsPage() {
  const { reservations } = useData()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [verificationFilter, setVerificationFilter] = useState("All")
  const [burialTypeFilter, setBurialTypeFilter] = useState("All")
  const [filesFor, setFilesFor] = useState<string | null>(null)

  const clearFilters = () => {
    setQuery("")
    setStatusFilter("All")
    setVerificationFilter("All")
    setBurialTypeFilter("All")
  }

  const filtered = useMemo(
    () =>
      reservations.filter(
        (r) =>
          (r.clientName.toLowerCase().includes(query.toLowerCase()) ||
            r.reservationNumber.toLowerCase().includes(query.toLowerCase()) ||
            r.plotNumber.toLowerCase().includes(query.toLowerCase())) &&
          (statusFilter === "All" || r.status === statusFilter) &&
          (verificationFilter === "All" ||
            r.verification === verificationFilter) &&
          (burialTypeFilter === "All" || r.burialType === burialTypeFilter),
      ),
    [query, statusFilter, verificationFilter, burialTypeFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 8)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            { label: "Pending Reservations", value: reservations.filter((r) => r.status === "Pending").length, icon: Clock, trend: { up: true, text: "4%" } },
            { label: "Reservations Under Verification", value: reservations.filter((r) => r.status === "Under Verification").length, icon: Search, trend: { up: true, text: "5%" } },
            { label: "Confirmed Reservations", value: reservations.filter((r) => r.status === "Confirmed").length, icon: CheckCircle, trend: { up: false, text: "6%" } },
            { label: "Cancelled Reservations", value: reservations.filter((r) => r.status === "Cancelled").length, icon: XCircle, trend: { up: true, text: "2%" } },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile key={label} label={label} value={value} icon={icon} trend={trend} />
        ))}
      </div>

      <Card title="Reservation Records">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reservation, client, or plot..."
            className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Statuses</option>
            {["Pending", "Under Verification", "Confirmed", "Cancelled"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ),
            )}
          </select>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Verifications</option>
            {[
              "Waiting for Checking",
              "Under Review",
              "Verified",
              "Requires Action",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={burialTypeFilter}
            onChange={(e) => setBurialTypeFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Burial Types</option>
            {["Private", "Vertical", "Public"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={clearFilters}
            className="neu-button px-3 py-1.5 text-sm"
          >
            Clear Filters
          </button>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Reservation No.</th>
              <th>Client</th>
              <th>Cemetery</th>
              <th>Plot</th>
              <th>Date</th>
              <th>Burial Type</th>
              <th>Verification</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-deep/10">
                <td className="py-1.5">{r.reservationNumber}</td>
                <td>{r.clientName}</td>
                <td>{cemeteryName(r.cemeteryId)}</td>
                <td>{r.plotNumber}</td>
                <td>{r.date}</td>
                <td>{r.burialType}</td>
                <td>
                  <StatusBadge status={r.verification} />
                </td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>
                  <button className="neu-button px-2.5 py-1 text-[11px]">Edit</button>{" "}
                  <button className="neu-button px-2.5 py-1 text-[11px]">Delete</button>{" "}
                  <button
                    onClick={() => setFilesFor(filesFor === r.id ? null : r.id)}
                    className="neu-button px-2.5 py-1 text-[11px]"
                  >
                    Files
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        {filesFor && (
          <ReservationFiles
            reservation={reservations.find((r) => r.id === filesFor)!}
          />
        )}
      </Card>
    </div>
  )
}
