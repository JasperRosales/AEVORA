import { Download, FileText, MapPin, RefreshCw, Trash2, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { StatusBadge } from "@/components/ui/status-badge"
import { reloadClientData, useClientData } from "@/data/client-store"
import { deleteAttachment, uploadAttachment } from "@/lib/neon-api"
import { Card, ErrorNote, fileSize, Spinner } from "./client-ui"

/** Reservations list; tapping a card expands its document manager. */
export function ReservationsTab() {
  const { status, reservations, error } = useClientData()
  const [openId, setOpenId] = useState<string | null>(null)

  if (status === "loading" || status === "idle") return <Spinner />
  if (status === "error") return <ErrorNote message={error ?? "Something went wrong."} />

  if (reservations.length === 0) {
    return (
      <Card>
        <p className="text-sm text-deep/70">
          You have no reservations on record yet.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {reservations.map((r) => (
        <Card key={r.id}>
          <button
            onClick={() => setOpenId(openId === r.id ? null : r.id)}
            className="w-full text-left"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">{r.reservation_number}</p>
              <StatusBadge status={r.status} />
            </div>
            <p className="mt-1 text-sm">
              Plot <span className="font-medium">{r.plot_number}</span> ·{" "}
              {r.burial_type}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-deep/60">
              <MapPin size={12} /> {r.cemetery} — {r.location}
            </p>
            <p className="mt-0.5 text-xs text-deep/60">Scheduled {r.date}</p>
          </button>
          {openId === r.id && <ReservationFiles reservationId={r.id} files={r.files} />}
        </Card>
      ))}
      <button
        onClick={() => reloadClientData()}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs text-deep/60"
      >
        <RefreshCw size={13} /> Refresh
      </button>
    </div>
  )
}

/** Upload / download / delete the documents attached to one reservation. */
function ReservationFiles({
  reservationId,
  files,
}: {
  reservationId: string
  files: { id: string; filename: string; size: number; created_at: string; url: string }[]
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  async function onUpload(file: File) {
    setBusy(true)
    setNote(null)
    try {
      await uploadAttachment(reservationId, file)
      setNote(`Uploaded ${file.name}`)
      reloadClientData()
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  async function onDelete(id: string, filename: string) {
    if (!window.confirm(`Delete ${filename}?`)) return
    setBusy(true)
    setNote(null)
    try {
      await deleteAttachment(id)
      setNote(`Deleted ${filename}`)
      reloadClientData()
    } catch (err) {
      setNote(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 border-t border-deep/10 pt-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-deep">
        <FileText size={13} /> Documents ({files.length})
      </p>

      {files.length === 0 && (
        <p className="mb-2 text-xs text-deep/50">No documents uploaded yet.</p>
      )}

      <ul className="mb-3 space-y-2">
        {files.map((f) => (
          <li
            key={f.id}
            className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{f.filename}</p>
              <p className="text-[11px] text-deep/50">
                {fileSize(f.size)} · {new Date(f.created_at).toLocaleDateString()}
              </p>
            </div>
            {/* Presigned URL, fresh from the list fetch (expires in 1 hour). */}
            <a
              href={f.url}
              target="_blank"
              rel="noopener"
              download={f.filename}
              aria-label={`Download ${f.filename}`}
              className="rounded-full p-2 text-navy transition hover:bg-navy/10"
            >
              <Download size={15} />
            </a>
            <button
              onClick={() => onDelete(f.id, f.filename)}
              disabled={busy}
              aria-label={`Delete ${f.filename}`}
              className="rounded-full p-2 text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ul>

      {note && <p className="mb-2 text-xs text-deep/70">{note}</p>}

      <input
        ref={fileInput}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onUpload(file)
        }}
      />
      <button
        onClick={() => fileInput.current?.click()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-deep/40 py-2.5 text-xs font-medium text-deep/70 transition active:bg-cream"
      >
        <Upload size={14} /> {busy ? "Working..." : "Upload a document"}
      </button>
    </div>
  )
}
