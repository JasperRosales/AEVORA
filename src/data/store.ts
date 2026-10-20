import { useSyncExternalStore } from "react"
import type {
  Agreement,
  AppNotification,
  Activity,
  Cemetery,
  Client,
  GeneratedReport,
  Payment,
  Plot,
  Reservation,
} from "@/types/domain"
import {
  fetchAll,
  fetchAttachments,
  isNeonConfigured,
  uploadAttachment,
  type Attachment,
} from "@/lib/neon-api"

export type { Attachment }

/** Everything the staff dashboard renders, loaded from Postgres via the API. */
export interface DataState {
  cemeteries: Cemetery[]
  plots: Plot[]
  reservations: Reservation[]
  clients: Client[]
  payments: Payment[]
  agreements: Agreement[]
  activities: Activity[]
  notifications: AppNotification[]
  generatedReports: GeneratedReport[]
  attachments: Attachment[]
}

const emptyState: DataState = {
  cemeteries: [],
  plots: [],
  reservations: [],
  clients: [],
  payments: [],
  agreements: [],
  activities: [],
  notifications: [],
  generatedReports: [],
  attachments: [],
}

let state: DataState = emptyState
const listeners = new Set<() => void>()

function set(patch: Partial<DataState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Current state — also read directly by non-React helpers like cemeteryName(). */
export function getData(): DataState {
  return state
}

let loadStarted = false

/** Loads every dataset from the API once. There is no local fallback: if the
 *  backend is unreachable the dashboard simply stays empty. */
export function ensureDataLoaded() {
  if (loadStarted || !isNeonConfigured) return
  loadStarted = true
  fetchAll()
    .then(
      ({
        cemeteries,
        plots,
        reservations,
        clients,
        payments,
        agreements,
        activities,
        notifications,
        reports,
      }) =>
        set({
          cemeteries,
          plots,
          reservations,
          clients,
          payments,
          agreements,
          activities,
          notifications,
          generatedReports: reports,
        })
    )
    .catch((err) => {
      console.error("[neon] failed to load data:", err)
    })
}

/** Subscribes a component to the dataset. */
export function useData(): DataState {
  return useSyncExternalStore(subscribe, getData, getData)
}

/** Loads attachments (Object Storage objects) for one reservation. */
export async function loadAttachments(
  reservationId: string
): Promise<Attachment[]> {
  const rows = await fetchAttachments(reservationId)
  set({
    attachments: [
      ...state.attachments.filter((a) => a.reservationId !== reservationId),
      ...rows,
    ],
  })
  return rows
}

/** Uploads a file into the `assets` bucket and records it against a reservation. */
export async function addAttachment(
  reservationId: string,
  file: File
): Promise<Attachment> {
  const row = await uploadAttachment(reservationId, file)
  set({ attachments: [...state.attachments, row] })
  return row
}

/* ------------------ quick-action creates (local update) ------------------ */

/** Appends a client created through the Add Client quick action. */
export function insertClient(row: Client) {
  set({ clients: [...state.clients, row] })
}

/** Appends a plot created through the Add Plot quick action. */
export function insertPlot(row: Plot) {
  set({ plots: [...state.plots, row] })
}

/** Appends a payment recorded through the Record Payment quick action. */
export function insertPayment(row: Payment) {
  set({ payments: [...state.payments, row] })
}

/** Prepends a generated report so it shows first in the Reports log. */
export function insertReport(row: GeneratedReport) {
  set({ generatedReports: [row, ...state.generatedReports] })
}

/**
 * Applies a created reservation plus the rows the API updates alongside it:
 * the booked plot (now Reserved) and the client's reservation count.
 */
export function insertReservation(created: {
  reservation: Reservation
  plot: Plot
  client: Client
}) {
  set({
    reservations: [...state.reservations, created.reservation],
    plots: state.plots.map((p) =>
      p.id === created.plot.id ? created.plot : p
    ),
    clients: state.clients.map((c) =>
      c.id === created.client.id ? created.client : c
    ),
  })
}
