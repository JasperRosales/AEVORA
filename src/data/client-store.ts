import { useSyncExternalStore } from "react"
import {
  fetchClientAgreements,
  fetchClientPayments,
  fetchClientReservations,
  fetchClientSummary,
  type ClientAgreement,
  type ClientPayment,
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
  reservations: ClientReservation[]
  payments: ClientPayment[]
  agreements: ClientAgreement[]
  error: string | null
}

const initial: ClientDataState = {
  status: "idle",
  summary: null,
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

/** Loads everything the signed-in client may see (all four endpoints at once). */
export function ensureClientDataLoaded() {
  if (loadStarted) return
  loadStarted = true
  set({ status: "loading" })
  Promise.all([
    fetchClientSummary(),
    fetchClientReservations(),
    fetchClientPayments(),
    fetchClientAgreements(),
  ])
    .then(([summary, reservations, payments, agreements]) =>
      set({ status: "ready", summary, reservations, payments, agreements }),
    )
    .catch((err) => {
      console.error("[client portal] load failed:", err)
      set({ status: "error", error: String(err) })
    })
}

/** Re-syncs after an upload/delete so counts and file lists stay fresh. */
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
