import { apiGet } from "@/lib/neon-api"

/**
 * Client-portal API. Every endpoint is scoped server-side to the signed-in
 * client (auth email → `clients` row), so these fetchers never take an owner
 * parameter — the server decides what you are allowed to see.
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

export function fetchClientSummary(): Promise<ClientSummary> {
  return apiGet<ClientSummary>("/client/summary")
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
