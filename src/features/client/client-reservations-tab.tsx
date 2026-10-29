import {
  CreditCard,
  Download,
  FileText,
  MapPin,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react"
import { useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { StatusBadge } from "@/components/ui/status-badge"
import { reloadClientData, useClientData } from "@/data/client-store"
import type { ClientReservation } from "@/lib/client-api"
import { EASE_OUT, stagger } from "@/lib/motion"
import { deleteAttachment, uploadAttachment } from "@/lib/neon-api"
import { balanceFor, PaymentSheet } from "./client-payment-sheet"
import { Card, ErrorNote, fileSize, pesos, Spinner } from "./client-ui"

/** Reservations list; tapping a card expands its document manager. */
export function ReservationsTab({
  onBrowsePlots,
  onOpenPayments,
}: {
  onBrowsePlots: () => void
  onOpenPayments: () => void
}) {
  const { status, reservations, payments, error } = useClientData()
  const [openId, setOpenId] = useState<string | null>(null)
  const [paying, setPaying] = useState<ClientReservation | null>(null)

  if (status === "loading" || status === "idle") return <Spinner />
  if (status === "error")
    return <ErrorNote message={error ?? "Something went wrong."} />

  if (reservations.length === 0) {
    return (
      <motion.div variants={stagger()} initial="hidden" animate="show">
        <Card>
          <p className="text-sm text-deep/70">
            You have no reservations on record yet.
          </p>
          <button
            onClick={onBrowsePlots}
            className="mt-2 text-xs font-semibold text-navy underline-offset-2 hover:underline"
          >
            Find an available plot
          </button>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={stagger(0.05, 0.02)}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {reservations.map((r) => {
        const balance = balanceFor(r, payments)
        const canPay = balance > 0 && r.status !== "Cancelled"
        return (
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
                {r.plot_category}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-deep/60">
                <MapPin size={12} /> {r.cemetery} — {r.location}
              </p>
              <p className="mt-0.5 text-xs text-deep/60">Scheduled {r.date}</p>
            </button>

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-deep/10 pt-3">
              <div>
                <p className="text-[11px] text-deep/60">
                  {canPay ? "Balance due" : "Plot balance"}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    canPay ? "text-navy" : "text-deep/60"
                  }`}
                >
                  {canPay ? pesos(balance) : "Settled"}
                </p>
              </div>
              {canPay && (
                <motion.button
                  onClick={() => setPaying(r)}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1.5 rounded-xl bg-navy px-3.5 py-2 text-xs font-semibold text-cream transition active:bg-deep"
                >
                  <CreditCard size={14} /> Pay now
                </motion.button>
              )}
            </div>

            <AnimatePresence initial={false}>
              {openId === r.id && (
                <motion.div
                  key="files"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.26, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <ReservationFiles reservationId={r.id} files={r.files} />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        )
      })}
      <motion.button
        onClick={() => reloadClientData()}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs text-deep/60"
      >
        <RefreshCw size={13} /> Refresh
      </motion.button>

      {paying && (
        <PaymentSheet
          reservation={paying}
          onClose={() => setPaying(null)}
          onViewPayments={onOpenPayments}
        />
      )}
    </motion.div>
  )
}

/** Upload / download / delete the documents attached to one reservation. */
function ReservationFiles({
  reservationId,
  files,
}: {
  reservationId: string
  files: {
    id: string
    filename: string
    size: number
    created_at: string
    url: string
  }[]
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

      <motion.ul
        variants={stagger(0.04)}
        initial="hidden"
        animate="show"
        className="mb-3 space-y-2"
      >
        {files.map((f) => (
          <motion.li
            key={f.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="flex items-center gap-2 rounded-lg bg-cream px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{f.filename}</p>
              <p className="text-[11px] text-deep/50">
                {fileSize(f.size)} ·{" "}
                {new Date(f.created_at).toLocaleDateString()}
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
          </motion.li>
        ))}
      </motion.ul>

      <AnimatePresence initial={false}>
        {note && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="mb-2 overflow-hidden text-xs text-deep/70"
          >
            {note}
          </motion.p>
        )}
      </AnimatePresence>

      <input
        ref={fileInput}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void onUpload(file)
        }}
      />
      <motion.button
        onClick={() => fileInput.current?.click()}
        disabled={busy}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-deep/40 py-2.5 text-xs font-medium text-deep/70 transition active:bg-cream"
      >
        <Upload size={14} /> {busy ? "Working..." : "Upload a document"}
      </motion.button>
    </div>
  )
}
