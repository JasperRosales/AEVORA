import { useState, type FormEvent } from "react"
import { Modal } from "@/components/ui/modal"
import { PLOT_CATEGORIES } from "@/lib/plot-category"
import {
  removeAgreement,
  removeClient,
  removePayment,
  removePlot,
  removeReport,
  removeReservation,
  updateAgreementRow,
  updateClientRow,
  updatePaymentRow,
  updatePlotRow,
  updateReportRow,
  updateReservationRow,
} from "@/data/store"
import {
  deleteAgreement,
  deleteClient,
  deletePayment,
  deletePlot,
  deleteReport,
  deleteReservation,
  updateAgreement,
  updateClient,
  updatePayment,
  updatePlot,
  updateReport,
  updateReservation,
} from "@/lib/neon-api"
import type {
  Agreement,
  Client,
  GeneratedReport,
  Payment,
  Plot,
  PlotCategory,
  PlotStatus,
  Reservation,
} from "@/types/domain"

/**
 * Shared edit/delete dialogs for the dashboard record tables. Each table row's
 * Edit button opens the matching modal prefilled with the row; Delete asks for
 * confirmation first. On success the API call updates Postgres and the store
 * applies the returned row locally, so the table refreshes without a reload.
 */

const LABEL = "mb-1 block text-xs font-medium text-deep"
const INPUT =
  "w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
const PRIMARY =
  "rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
const GHOST = "neu-button px-4 py-2 text-sm"

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/* ------------------------------ form plumbing ----------------------------- */

interface FieldSpec {
  key: string
  label: string
  /** "number" coerces to Number on submit; "date" renders a date picker. */
  type?: "text" | "number" | "date" | "select"
  required?: boolean
  options?: readonly string[]
}

interface RecordFormProps {
  fields: FieldSpec[]
  initialValues: Record<string, string>
  submitLabel: string
  onSubmit: (values: Record<string, string>) => Promise<void>
  onClose: () => void
}

function RecordForm({
  fields,
  initialValues,
  submitLabel,
  onSubmit,
  onClose,
}: RecordFormProps) {
  const [values, setValues] = useState(initialValues)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.key}>
            <label className={LABEL} htmlFor={`field-${f.key}`}>
              {f.label}
            </label>
            {f.type === "select" ? (
              <select
                id={`field-${f.key}`}
                value={values[f.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                className={INPUT}
              >
                {f.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`field-${f.key}`}
                type={f.type === "number" ? "number" : f.type ?? "text"}
                required={f.required ?? true}
                value={values[f.key]}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                className={INPUT}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={GHOST}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={PRIMARY}>
          {busy ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  )
}

/* ------------------------------ delete confirm ---------------------------- */

interface ConfirmDeleteProps {
  open: boolean
  onClose: () => void
  title: string
  /** What the delete does — shown so nobody nukes a row by accident. */
  message: string
  /** Performs the API call + store update; resolves when done. */
  confirm: () => Promise<void>
}

export function ConfirmDeleteModal({
  open,
  onClose,
  title,
  message,
  confirm,
}: ConfirmDeleteProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onConfirm() {
    setBusy(true)
    setError(null)
    try {
      await confirm()
      setBusy(false)
      onClose()
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-3">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <p className="text-sm text-deep">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={GHOST}>
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onConfirm()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-cream transition hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* --------------------------------- Clients -------------------------------- */

const CLIENT_FIELDS: FieldSpec[] = [
  { key: "fullName", label: "Full name" },
  { key: "contactNumber", label: "Contact number" },
  { key: "email", label: "Email", type: "text" },
  {
    key: "type",
    label: "Type",
    type: "select",
    options: ["Individual", "Corporate"],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Active", "Pending", "Inactive"],
  },
]

export function EditClientModal({
  record,
  onClose,
}: {
  record: Client | null
  onClose: () => void
}) {
  return (
    <Modal
      open={record !== null}
      onClose={onClose}
      title={`Edit Client — ${record?.clientId ?? ""}`}
      description="Update the client's contact details and status."
    >
      {record && (
        <RecordForm
          fields={CLIENT_FIELDS}
          initialValues={{
            fullName: record.fullName,
            contactNumber: record.contactNumber,
            email: record.email,
            type: record.type,
            status: record.status,
          }}
          submitLabel="Save Changes"
          onClose={onClose}
          onSubmit={async (v) => {
            const updated = await updateClient(record.id, {
              fullName: v.fullName.trim(),
              contactNumber: v.contactNumber.trim(),
              email: v.email.trim(),
              type: v.type as Client["type"],
              status: v.status as Client["status"],
            })
            updateClientRow(updated)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}

export function DeleteClientModal({
  record,
  onClose,
}: {
  record: Client | null
  onClose: () => void
}) {
  return (
    <ConfirmDeleteModal
      open={record !== null}
      onClose={onClose}
      title="Delete Client"
      message={`Delete ${record?.clientId} — ${record?.fullName}? This cannot be undone. Clients with reservations must have those deleted first.`}
      confirm={async () => {
        if (!record) return
        await deleteClient(record.id)
        removeClient(record.id)
      }}
    />
  )
}

/* ---------------------------------- Plots --------------------------------- */

const PLOT_FIELDS: FieldSpec[] = [
  { key: "size", label: "Size" },
  { key: "price", label: "Price", type: "number" },
  {
    key: "type",
    label: "Type",
    type: "select",
    options: PLOT_CATEGORIES,
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      "Available",
      "Reserved",
      "Occupied",
      "Waiting for Checking",
      "Unavailable",
    ],
  },
  { key: "reservedFor", label: "Reserved for (optional)", required: false },
]

export function EditPlotModal({
  record,
  onClose,
}: {
  record: Plot | null
  onClose: () => void
}) {
  return (
    <Modal
      open={record !== null}
      onClose={onClose}
      title={`Edit Plot — ${record?.plotNumber ?? ""}`}
      description="Location is fixed; type, size, price and status can change."
    >
      {record && (
        <RecordForm
          key={record.id}
          fields={PLOT_FIELDS}
          initialValues={{
            size: record.size,
            price: String(record.price),
            type: record.type,
            status: record.status,
            reservedFor: record.reservedFor ?? "",
          }}
          submitLabel="Save Changes"
          onClose={onClose}
          onSubmit={async (v) => {
            const updated = await updatePlot(record.id, {
              size: v.size.trim(),
              price: Number(v.price),
              type: v.type as PlotCategory,
              status: v.status as PlotStatus,
              reservedFor: v.reservedFor.trim(),
            })
            updatePlotRow(updated)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}

export function DeletePlotModal({
  record,
  onClose,
}: {
  record: Plot | null
  onClose: () => void
}) {
  return (
    <ConfirmDeleteModal
      open={record !== null}
      onClose={onClose}
      title="Delete Plot"
      message={`Delete plot ${record?.plotNumber}? Reserved or occupied plots must be freed first. This cannot be undone.`}
      confirm={async () => {
        if (!record) return
        await deletePlot(record.id)
        removePlot(record.id)
      }}
    />
  )
}

/* ------------------------------- Reservations ----------------------------- */

const RESERVATION_FIELDS: FieldSpec[] = [
  { key: "date", label: "Schedule date", type: "date" },
  {
    key: "plotCategory",
    label: "Plot category",
    type: "select",
    options: PLOT_CATEGORIES,
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Pending", "Under Verification", "Confirmed", "Cancelled"],
  },
  {
    key: "verification",
    label: "Verification",
    type: "select",
    options: [
      "Waiting for Checking",
      "Under Review",
      "Verified",
      "Requires Action",
    ],
  },
]

export function EditReservationModal({
  record,
  onClose,
}: {
  record: Reservation | null
  onClose: () => void
}) {
  return (
    <Modal
      open={record !== null}
      onClose={onClose}
      title={`Edit Reservation — ${record?.reservationNumber ?? ""}`}
      description="Update the schedule, plot category, status and verification."
    >
      {record && (
        <RecordForm
          fields={RESERVATION_FIELDS}
          initialValues={{
            date: record.date,
            plotCategory: record.plotCategory,
            status: record.status,
            verification: record.verification,
          }}
          submitLabel="Save Changes"
          onClose={onClose}
          onSubmit={async (v) => {
            const updated = await updateReservation(record.id, {
              date: v.date,
              plotCategory: v.plotCategory as PlotCategory,
              status: v.status as Reservation["status"],
              verification: v.verification as Reservation["verification"],
            })
            updateReservationRow(updated)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}

export function DeleteReservationModal({
  record,
  onClose,
}: {
  record: Reservation | null
  onClose: () => void
}) {
  return (
    <ConfirmDeleteModal
      open={record !== null}
      onClose={onClose}
      title="Delete Reservation"
      message={`Delete reservation ${record?.reservationNumber} for ${record?.clientName}? The booked plot is released back to Available. This cannot be undone.`}
      confirm={async () => {
        if (!record) return
        const result = await deleteReservation(record.id)
        removeReservation({ id: record.id, plot: result.plot, client: result.client })
      }}
    />
  )
}

/* --------------------------------- Payments ------------------------------- */

const PAYMENT_FIELDS: FieldSpec[] = [
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      "Reservation Fee",
      "Down Payment",
      "Installment",
      "Full Payment",
    ],
  },
  { key: "amount", label: "Amount", type: "number" },
  { key: "date", label: "Date", type: "date" },
  {
    key: "method",
    label: "Method",
    type: "select",
    options: ["Cash", "Bank Transfer", "Card", "Online"],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Paid", "Pending", "Overdue"],
  },
]

export function EditPaymentModal({
  record,
  onClose,
}: {
  record: Payment | null
  onClose: () => void
}) {
  return (
    <Modal
      open={record !== null}
      onClose={onClose}
      title={`Edit Payment — ${record?.receiptNumber ?? ""}`}
      description="Update the amount, date, method and status."
    >
      {record && (
        <RecordForm
          fields={PAYMENT_FIELDS}
          initialValues={{
            type: record.type,
            amount: String(record.amount),
            date: record.date,
            method: record.method,
            status: record.status,
          }}
          submitLabel="Save Changes"
          onClose={onClose}
          onSubmit={async (v) => {
            const updated = await updatePayment(record.id, {
              type: v.type as Payment["type"],
              amount: Number(v.amount),
              date: v.date,
              method: v.method as Payment["method"],
              status: v.status as Payment["status"],
            })
            updatePaymentRow(updated)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}

export function DeletePaymentModal({
  record,
  onClose,
}: {
  record: Payment | null
  onClose: () => void
}) {
  return (
    <ConfirmDeleteModal
      open={record !== null}
      onClose={onClose}
      title="Delete Payment"
      message={`Delete payment ${record?.receiptNumber} (${record?.type} for ${record?.clientName})? This cannot be undone.`}
      confirm={async () => {
        if (!record) return
        await deletePayment(record.id)
        removePayment(record.id)
      }}
    />
  )
}

/* -------------------------------- Agreements ------------------------------ */

const AGREEMENT_FIELDS: FieldSpec[] = [
  {
    key: "type",
    label: "Type",
    type: "select",
    options: [
      "Reservation Agreement",
      "Deed of Sale",
      "Maintenance Agreement",
    ],
  },
  { key: "dateSigned", label: "Date signed", type: "date" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Pending", "Active", "Completed", "Cancelled"],
  },
]

export function EditAgreementModal({
  record,
  onClose,
}: {
  record: Agreement | null
  onClose: () => void
}) {
  return (
    <Modal
      open={record !== null}
      onClose={onClose}
      title={`Edit Agreement — ${record?.agreementNumber ?? ""}`}
      description="Update the type, date signed and status."
    >
      {record && (
        <RecordForm
          fields={AGREEMENT_FIELDS}
          initialValues={{
            type: record.type,
            dateSigned: record.dateSigned,
            status: record.status,
          }}
          submitLabel="Save Changes"
          onClose={onClose}
          onSubmit={async (v) => {
            const updated = await updateAgreement(record.id, {
              type: v.type as Agreement["type"],
              dateSigned: v.dateSigned,
              status: v.status as Agreement["status"],
            })
            updateAgreementRow(updated)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}

export function DeleteAgreementModal({
  record,
  onClose,
}: {
  record: Agreement | null
  onClose: () => void
}) {
  return (
    <ConfirmDeleteModal
      open={record !== null}
      onClose={onClose}
      title="Delete Agreement"
      message={`Delete agreement ${record?.agreementNumber} for ${record?.clientName}? This cannot be undone.`}
      confirm={async () => {
        if (!record) return
        await deleteAgreement(record.id)
        removeAgreement(record.id)
      }}
    />
  )
}

/* --------------------------------- Reports -------------------------------- */

const REPORT_FIELDS: FieldSpec[] = [
  { key: "name", label: "Report name" },
  { key: "type", label: "Type" },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: ["Ready", "Processing"],
  },
]

export function EditReportModal({
  record,
  onClose,
}: {
  record: GeneratedReport | null
  onClose: () => void
}) {
  return (
    <Modal
      open={record !== null}
      onClose={onClose}
      title="Edit Report"
      description="Rename the report or update its type and status."
    >
      {record && (
        <RecordForm
          fields={REPORT_FIELDS}
          initialValues={{
            name: record.name,
            type: record.type,
            status: record.status,
          }}
          submitLabel="Save Changes"
          onClose={onClose}
          onSubmit={async (v) => {
            const updated = await updateReport(record.id, {
              name: v.name.trim(),
              type: v.type.trim(),
              status: v.status as GeneratedReport["status"],
            })
            updateReportRow(updated)
            onClose()
          }}
        />
      )}
    </Modal>
  )
}

export function DeleteReportModal({
  record,
  onClose,
}: {
  record: GeneratedReport | null
  onClose: () => void
}) {
  return (
    <ConfirmDeleteModal
      open={record !== null}
      onClose={onClose}
      title="Delete Report"
      message={`Delete report "${record?.name}"? This cannot be undone.`}
      confirm={async () => {
        if (!record) return
        await deleteReport(record.id)
        removeReport(record.id)
      }}
    />
  )
}
