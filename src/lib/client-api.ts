import { apiGet, apiSend } from "@/lib/neon-api"
import type { BurialType, PlotStatus } from "@/types/domain"

/**
 * Client-portal API. Every endpoint is scoped server-side to the signed-in
 * client (auth email → `clients` row), so these fetchers never take an owner
 * parameter — the server decides what you are allowed to see or buy.
 */

export interface ClientProfile {
  id: string
  clientId: string
  fullName: string
  contactNumber: string
  email: string
  type: string
  registeredAt: string
  status: string
  reservations: number
}

export interface ClientSummary {
  client: ClientProfile | null
  profile?: { name: string; email: string }
  reservations: number
  totalPaid?: number
  paymentCount?: number
  nextReservation: {
    reservation_number: string
    plot_number: string
    date: string
    burial_type: string
    status: string
    verification: string
  } | null
}

/** A plot on the portal map/catalogue (owner details are never sent). */
export interface ClientPlot {
  id: string
  plot_number: string
  cemetery_id: string
  section: string
  row: number
  column: number
  type: BurialType
  size: string
  price: number
  status: PlotStatus
  cemetery: string
  location: string
}

export interface ClientReservation {
  id: string
  reservation_number: string
  plot_number: string
  date: string
  burial_type: string
  status: string
  verification: string
  cemetery: string
  location: string
  /** Plot price, so the portal can show the balance still owed. */
  price: number
  files: {
    id: string
    filename: string
    content_type: string
    size: number
    created_at: string
    url: string
  }[]
}

export interface ClientPayment {
  receipt_number: string
  plot_number: string
  type: string
  amount: number
  date: string
  status: string
  method: string
  cemetery: string
}

export interface ClientAgreement {
  agreement_number: string
  plot_number: string
  type: string
  date_signed: string
  status: string
  cemetery: string
}

export const PAYMENT_TYPES = [
  "Reservation Fee",
  "Down Payment",
  "Installment",
  "Full Payment",
] as const

export const PAYMENT_METHODS = [
  "Online",
  "Card",
  "Bank Transfer",
  "Cash",
] as const

export const BURIAL_TYPES = ["Private", "Vertical", "Public"] as const

export function fetchClientSummary(): Promise<ClientSummary> {
  return apiGet<ClientSummary>("/client/summary")
}

/** Every plot with its status, for the map (the list filters to Available). */
export function fetchClientPlots(): Promise<ClientPlot[]> {
  return apiGet<ClientPlot[]>("/client/plots?scope=all")
}

export function fetchClientReservations(): Promise<ClientReservation[]> {
  return apiGet<ClientReservation[]>("/client/reservations")
}

export function fetchClientPayments(): Promise<ClientPayment[]> {
  return apiGet<ClientPayment[]>("/client/payments")
}

export function fetchClientAgreements(): Promise<ClientAgreement[]> {
  return apiGet<ClientAgreement[]>("/client/agreements")
}

/** Books an Available plot for the signed-in family (server-side ownership). */
export function createClientReservation(input: {
  plotId: string
  date: string
  burialType: (typeof BURIAL_TYPES)[number]
}): Promise<ClientReservation> {
  return apiSend<ClientReservation>("POST", "/client/reservations", input)
}

/**
 * Submits a payment against one of the family's reservations. The server files
 * it as Pending until the office confirms the money arrived.
 */
export function createClientPayment(input: {
  reservationId: string
  type: (typeof PAYMENT_TYPES)[number]
  amount: number
  method: (typeof PAYMENT_METHODS)[number]
  date: string
}): Promise<ClientPayment> {
  return apiSend<ClientPayment>("POST", "/client/payments", input)
}
