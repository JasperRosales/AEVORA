import { useState, type FormEvent } from "react"
import { Modal } from "@/components/ui/modal"
import { cemeteryName } from "@/components/cemetery-selector"
import {
  insertClient,
  insertPayment,
  insertPlot,
  insertReport,
  insertReservation,
  useData,
} from "@/data/store"
import {
  createClient,
  createPayment,
  createPlot,
  createReport,
  createReservation,
  type ClientPortalProvision,
} from "@/lib/neon-api"
import { PLOT_CATEGORIES } from "@/lib/plot-category"
import type {
  Client,
  Payment,
  Plot,
  PlotCategory,
  PlotStatus,
} from "@/types/domain"

/**
 * Forms behind the Overview quick actions. Each modal keeps its fields in an
 * inner component rendered as the dialog's children, so typing is discarded
 * when the dialog closes (the panel, and with it the form state, unmounts
 * after the exit animation).
 *
 * On success the form posts to the API, mirrors the created row into the shared
 * store so the dashboard updates without a reload, and reports up through
 * `onCreated` for the card's confirmation.
 */

/** Report types offered by the Generate Report action and the report tiles. */
export const REPORT_TYPES = [
  "Plot Occupancy",
  "Reservations",
  "Clients",
  "Payments",
  "Agreements",
  "Information Checking",
] as const

export type ReportType = (typeof REPORT_TYPES)[number]

const CLIENT_TYPES: Client["type"][] = ["Individual", "Corporate"]
const CLIENT_STATUSES: Client["status"][] = ["Active", "Pending", "Inactive"]
const PLOT_STATUSES: PlotStatus[] = [
  "Available",
  "Waiting for Checking",
  "Occupied",
  "Unavailable",
]
const PAYMENT_TYPES: Payment["type"][] = [
  "Reservation Fee",
  "Down Payment",
  "Installment",
  "Full Payment",
]
const PAYMENT_STATUSES: Payment["status"][] = ["Paid", "Pending", "Overdue"]
const PAYMENT_METHODS: Payment["method"][] = [
  "Cash",
  "Bank Transfer",
  "Card",
  "Online",
]

const LABEL = "mb-1 block text-xs font-medium text-deep"
const INPUT =
  "w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
const PRIMARY =
  "rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
const GHOST = "neu-button px-4 py-2 text-sm"

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

interface ActionModalProps {
  open: boolean
  onClose: () => void
  /** Fires after a successful create: closes the modal and flags success. */
  onCreated: (message: string) => void
}

type FormProps = Omit<ActionModalProps, "open">

/* ------------------------------- Add Client ------------------------------- */

function AddClientForm({ onCreated, onClose }: FormProps) {
  const [fullName, setFullName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [email, setEmail] = useState("")
  const [type, setType] = useState<Client["type"]>("Individual")
  const [status, setStatus] = useState<Client["status"]>("Active")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The portal account the API provisions with the record. Held in the modal
  // (not the transient card notice) so staff can read the one-time password
  // over to the family before the dialog closes.
  const [portal, setPortal] = useState<ClientPortalProvision | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createClient({
        fullName: fullName.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim(),
        type,
        status,
      })
      insertClient(created)
      setPortal(created.portal)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (portal) {
    return (
      <div className="space-y-3">
        <p className="rounded-lg bg-teal/10 px-3 py-2 text-sm text-deep">
          Client <strong>{fullName}</strong> was added, and their portal account
          was created automatically.
        </p>
        {portal.tempPassword ? (
          <>
            <div className="rounded-lg border border-deep/20 bg-cream px-3 py-2 text-sm">
              <p className="text-xs font-medium text-deep/60">
                Portal sign-in for {portal.email}
              </p>
              <p className="mt-1 font-mono text-base font-semibold text-navy">
                {portal.tempPassword}
              </p>
              <p className="mt-1 text-xs text-deep/60">
                Give this password to the family — they can sign in at
                /client/login.
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onCreated(`Client ${fullName} added — portal login ready`)
                }
                className={PRIMARY}
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              The portal account could not be created: {portal.error}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onCreated(
                    `Client ${fullName} added — portal account failed: ${portal.error}`
                  )
                }
                className={PRIMARY}
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="client-name">
            Full name
          </label>
          <input
            id="client-name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Maria Santos"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="client-contact">
            Contact number
          </label>
          <input
            id="client-contact"
            required
            value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)}
            placeholder="0917-555-0101"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="client-email">
            Email
          </label>
          <input
            id="client-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maria.santos@email.com"
            className={INPUT}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor="client-type">
              Type
            </label>
            <select
              id="client-type"
              value={type}
              onChange={(e) => setType(e.target.value as Client["type"])}
              className={INPUT}
            >
              {CLIENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="client-status">
              Status
            </label>
            <select
              id="client-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Client["status"])}
              className={INPUT}
            >
              {CLIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={GHOST}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={PRIMARY}>
          {busy ? "Adding..." : "Add Client"}
        </button>
      </div>
    </form>
  )
}

export function AddClientModal({ open, onClose, onCreated }: ActionModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Client"
      description="Register a new client record in the cemetery system."
    >
      <AddClientForm onCreated={onCreated} onClose={onClose} />
    </Modal>
  )
}

/* -------------------------------- Add Plot -------------------------------- */

function AddPlotForm({ onCreated, onClose }: FormProps) {
  const { cemeteries } = useData()
  const [cemeteryId, setCemeteryId] = useState("")
  const [section, setSection] = useState("")
  const [row, setRow] = useState("")
  const [column, setColumn] = useState("")
  const [plotType, setPlotType] = useState<PlotCategory>("Typical Block")
  const [size, setSize] = useState("")
  const [price, setPrice] = useState("")
  const [status, setStatus] = useState<PlotStatus>("Available")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createPlot({
        cemeteryId,
        section: section.trim(),
        row: Number(row),
        column: Number(column),
        type: plotType,
        size: size.trim(),
        price: Number(price),
        status,
      })
      insertPlot(created)
      onCreated(
        `Plot ${created.plotNumber} added to ${cemeteryName(created.cemeteryId)}`
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="plot-cemetery">
            Cemetery
          </label>
          <select
            id="plot-cemetery"
            required
            value={cemeteryId}
            onChange={(e) => setCemeteryId(e.target.value)}
            className={INPUT}
          >
            <option value="">Select cemetery...</option>
            {cemeteries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="plot-type">
            Type
          </label>
          <select
            id="plot-type"
            value={plotType}
            onChange={(e) => setPlotType(e.target.value as PlotCategory)}
            className={INPUT}
          >
            {PLOT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={LABEL} htmlFor="plot-section">
              Section
            </label>
            <input
              id="plot-section"
              required
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="A"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="plot-row">
              Row
            </label>
            <input
              id="plot-row"
              type="number"
              min={1}
              required
              value={row}
              onChange={(e) => setRow(e.target.value)}
              placeholder="1"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="plot-column">
              Column
            </label>
            <input
              id="plot-column"
              type="number"
              min={1}
              required
              value={column}
              onChange={(e) => setColumn(e.target.value)}
              placeholder="1"
              className={INPUT}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL} htmlFor="plot-size">
              Size
            </label>
            <input
              id="plot-size"
              required
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="1.2m × 2.4m"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL} htmlFor="plot-price">
              Price (₱)
            </label>
            <input
              id="plot-price"
              type="number"
              min={0}
              step={1}
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="15000"
              className={INPUT}
            />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <label className={LABEL} htmlFor="plot-status">
            Status
          </label>
          <select
            id="plot-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PlotStatus)}
            className={INPUT}
          >
            {PLOT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={GHOST}>
            Cancel
          </button>
          <button type="submit" disabled={busy} className={PRIMARY}>
            {busy ? "Adding..." : "Add Plot"}
          </button>
        </div>
      </div>
    </form>
  )
}

export function AddPlotModal({ open, onClose, onCreated }: ActionModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Plot"
      description="Add a plot to a cemetery section. The plot number is derived from section, row and column. For a whole block, use Build Plot Grid on the Cemetery Map."
    >
      <AddPlotForm onCreated={onCreated} onClose={onClose} />
    </Modal>
  )
}

/* --------------------------- Create Reservation --------------------------- */

function CreateReservationForm({
  onCreated,
  onClose,
  initialPlot,
}: FormProps & { initialPlot?: Plot }) {
  const { cemeteries, clients, plots } = useData()
  const [clientId, setClientId] = useState("")
  const [cemeteryId, setCemeteryId] = useState(
    initialPlot?.cemeteryId ?? ""
  )
  const [plotId, setPlotId] = useState(initialPlot?.id ?? "")
  const [plotCategory, setPlotCategory] = useState<PlotCategory>(
    initialPlot?.type ?? "Typical Block"
  )
  const [date, setDate] = useState(today())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availablePlots = plots.filter(
    (p) => p.cemeteryId === cemeteryId && p.status === "Available"
  )

  function onPickPlot(value: string) {
    setPlotId(value)
    const plot = plots.find((p) => p.id === value)
    if (plot) setPlotCategory(plot.type)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createReservation({
        clientId,
        plotId,
        date,
        plotCategory,
      })
      insertReservation(created)
      onCreated(
        `Reservation ${created.reservation.reservationNumber} created for plot ${created.reservation.plotNumber}`
      )
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL} htmlFor="res-client">
            Client
          </label>
          <select
            id="res-client"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={INPUT}
          >
            <option value="">Select client...</option>
            {clients
              .slice()
              .sort((a, b) => a.fullName.localeCompare(b.fullName))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.clientId})
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="res-cemetery">
            Cemetery
          </label>
          <select
            id="res-cemetery"
            required
            value={cemeteryId}
            onChange={(e) => {
              setCemeteryId(e.target.value)
              setPlotId("")
            }}
            className={INPUT}
          >
            <option value="">Select cemetery...</option>
            {cemeteries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="res-plot">
            Plot
          </label>
          <select
            id="res-plot"
            required
            value={plotId}
            onChange={(e) => onPickPlot(e.target.value)}
            disabled={!cemeteryId}
            className={INPUT}
          >
            <option value="">
              {cemeteryId
                ? availablePlots.length > 0
                  ? "Select available plot..."
                  : "No available plots"
                : "Pick a cemetery first"}
            </option>
            {availablePlots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.plotNumber} · Section {p.section} · {p.type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="res-category">
            Plot category
          </label>
          <select
            id="res-category"
            value={plotCategory}
            onChange={(e) => setPlotCategory(e.target.value as PlotCategory)}
            className={INPUT}
          >
            {PLOT_CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="res-date">
            Reservation date
          </label>
          <input
            id="res-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>
      {cemeteryId && availablePlots.length === 0 && (
        <p className="text-xs text-deep/60">
          No available plots in this cemetery — add one with the Add Plot
          action.
        </p>
      )}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={GHOST}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || availablePlots.length === 0}
          className={PRIMARY}
        >
          {busy ? "Creating..." : "Create Reservation"}
        </button>
      </div>
    </form>
  )
}

export function CreateReservationModal({
  open,
  onClose,
  onCreated,
  initialPlot,
}: ActionModalProps & { initialPlot?: Plot }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create Reservation"
      description={
        initialPlot
          ? `Reserve plot ${initialPlot.plotNumber} for a client. The plot is marked Reserved and the booking starts Pending verification.`
          : "Reserve an available plot for a client. The plot is marked Reserved and the booking starts Pending verification."
      }
    >
      <CreateReservationForm
        initialPlot={initialPlot}
        onCreated={onCreated}
        onClose={onClose}
      />
    </Modal>
  )
}

/* ----------------------------- Record Payment ----------------------------- */

function RecordPaymentForm({ onCreated, onClose }: FormProps) {
  const { cemeteries, clients, plots } = useData()
  const [clientId, setClientId] = useState("")
  const [cemeteryId, setCemeteryId] = useState("")
  const [plotId, setPlotId] = useState("")
  const [type, setType] = useState<Payment["type"]>("Reservation Fee")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<Payment["method"]>("Cash")
  const [status, setStatus] = useState<Payment["status"]>("Paid")
  const [date, setDate] = useState(today())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cemeteryPlots = plots.filter((p) => p.cemeteryId === cemeteryId)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createPayment({
        clientId,
        plotId,
        type,
        amount: Number(amount),
        method,
        status,
        date,
      })
      insertPayment(created)
      onCreated(`Payment ${created.receiptNumber} recorded`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="pay-client">
            Client
          </label>
          <select
            id="pay-client"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={INPUT}
          >
            <option value="">Select client...</option>
            {clients
              .slice()
              .sort((a, b) => a.fullName.localeCompare(b.fullName))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.clientId})
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="pay-cemetery">
            Cemetery
          </label>
          <select
            id="pay-cemetery"
            required
            value={cemeteryId}
            onChange={(e) => {
              setCemeteryId(e.target.value)
              setPlotId("")
            }}
            className={INPUT}
          >
            <option value="">Select cemetery...</option>
            {cemeteries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="pay-plot">
            Plot
          </label>
          <select
            id="pay-plot"
            required
            value={plotId}
            onChange={(e) => setPlotId(e.target.value)}
            disabled={!cemeteryId}
            className={INPUT}
          >
            <option value="">
              {cemeteryId ? "Select plot..." : "Pick a cemetery first"}
            </option>
            {cemeteryPlots.map((p) => (
              <option key={p.id} value={p.id}>
                {p.plotNumber} · {p.status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="pay-amount">
            Amount (₱)
          </label>
          <input
            id="pay-amount"
            type="number"
            min={1}
            step={1}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="5000"
            className={INPUT}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="pay-type">
            Payment type
          </label>
          <select
            id="pay-type"
            value={type}
            onChange={(e) => setType(e.target.value as Payment["type"])}
            className={INPUT}
          >
            {PAYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="pay-method">
            Method
          </label>
          <select
            id="pay-method"
            value={method}
            onChange={(e) => setMethod(e.target.value as Payment["method"])}
            className={INPUT}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="pay-status">
            Status
          </label>
          <select
            id="pay-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Payment["status"])}
            className={INPUT}
          >
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="pay-date">
            Date
          </label>
          <input
            id="pay-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={GHOST}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !cemeteryPlots.length}
          className={PRIMARY}
        >
          {busy ? "Recording..." : "Record Payment"}
        </button>
      </div>
    </form>
  )
}

export function RecordPaymentModal({
  open,
  onClose,
  onCreated,
}: ActionModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      description="Log a payment transaction against a client's plot."
    >
      <RecordPaymentForm onCreated={onCreated} onClose={onClose} />
    </Modal>
  )
}

/* ----------------------------- Generate Report ---------------------------- */

function GenerateReportForm({ onCreated, onClose }: FormProps) {
  const [type, setType] = useState<string>(REPORT_TYPES[0])
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await createReport({
        type,
        name: name.trim() || undefined,
      })
      insertReport(created)
      onCreated(`${created.name} generated`)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={LABEL} htmlFor="report-type">
            Report type
          </label>
          <select
            id="report-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={INPUT}
          >
            {REPORT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL} htmlFor="report-name">
            Report name (optional)
          </label>
          <input
            id="report-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`${type} Report`}
            className={INPUT}
          />
        </div>
      </div>
      <p className="text-xs text-deep/60">
        The report is logged as Ready and appears at the top of Recent Reports
        on the Reports page.
      </p>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={GHOST}>
          Cancel
        </button>
        <button type="submit" disabled={busy} className={PRIMARY}>
          {busy ? "Generating..." : "Generate Report"}
        </button>
      </div>
    </form>
  )
}

export function GenerateReportModal({
  open,
  onClose,
  onCreated,
}: ActionModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Generate Report"
      description="Create a report record and open it in the Reports log."
    >
      <GenerateReportForm onCreated={onCreated} onClose={onClose} />
    </Modal>
  )
}
