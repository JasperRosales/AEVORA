import { useSyncExternalStore } from "react"
import {
  fetchClientAgreements,
  fetchClientPayments,
  fetchClientPlots,
  fetchClientReservations,
  fetchClientSummary,
  type ClientAgreement,
  type ClientPayment,
  type ClientPlot,
  type ClientReservation,
  type ClientSummary,
} from "@/lib/client-api"

/**
 * Data for the mobile client portal. Loaded on demand when a client-role user
 * signs in; every dataset is already scoped to them by the server.
 */
export interface ClientDataState {
  status: "idle" | "loading" | "ready" | "error"
  summary: ClientSummary | null
  /** Every plot with its status (owner details excluded), for the map. */
  plots: ClientPlot[]
  reservations: ClientReservation[]
  payments: ClientPayment[]
  agreements: ClientAgreement[]
  error: string | null
}

const initial: ClientDataState = {
  status: "idle",
  summary: null,
  plots: [],
  reservations: [],
  payments: [],
  agreements: [],
  error: null,
}

let state: ClientDataState = initial
const listeners = new Set<() => void>()

function set(patch: Partial<ClientDataState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getClientState(): ClientDataState {
  return state
}

let loadStarted = false

/** Loads everything the signed-in client may see (all five endpoints at once). */
export function ensureClientDataLoaded() {
  if (loadStarted) return
  loadStarted = true
  // A reload after booking or paying must not blank the screen: the current
  // data stays up and is replaced when the new snapshot arrives. Only the very
  // first load shows the full spinner.
  if (state.status !== "ready") set({ status: "loading" })
  Promise.all([
    fetchClientSummary(),
    fetchClientPlots(),
    fetchClientReservations(),
    fetchClientPayments(),
    fetchClientAgreements(),
  ])
    .then(([summary, plots, reservations, payments, agreements]) =>
      set({
        status: "ready",
        summary,
        plots,
        reservations,
        payments,
        agreements,
      })
    )
    .catch((err) => {
      console.error("[client portal] load failed:", err)
      if (state.status === "ready") return // keep the last good snapshot
      set({ status: "error", error: String(err) })
    })
}

/** Re-syncs after a booking, payment, upload or delete. */
export function reloadClientData() {
  loadStarted = false
  ensureClientDataLoaded()
}

export function resetClientData() {
  loadStarted = false
  state = initial
  for (const listener of listeners) listener()
}

export function useClientData(): ClientDataState {
  return useSyncExternalStore(subscribe, getClientState, getClientState)
}
