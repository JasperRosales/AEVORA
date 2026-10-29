import { getAuthToken, isAuthConfigured } from "@/lib/auth"
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

const BASE = import.meta.env.VITE_NEON_API_URL as string | undefined
const KEY = import.meta.env.VITE_NEON_API_KEY as string | undefined

/** True when the Neon Function URL + key are present in the environment. */
export const isNeonConfigured = Boolean(BASE && KEY)

export interface Attachment {
  id: string
  reservationId: string
  key: string
  filename: string
  contentType: string
  size: number
  createdAt: string
  url: string
}

/**
 * Bearer value for API calls. With auth configured, fail closed instead of
 * silently falling back to the ops key — that fallback authenticates the
 * request as an admin and would mask a missing session token (which is how a
 * client login could look like the wrong role).
 */
async function authHeader(): Promise<string> {
  const token = await getAuthToken()
  if (token) return `Bearer ${token}`
  if (isAuthConfigured) throw new Error("Not authenticated")
  if (!KEY) throw new Error("API key is not configured")
  return `Bearer ${KEY}`
}

/** Every call carries the user's Neon Auth JWT (ops key only without auth). */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: await authHeader() },
  })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`)
  return (await res.json()) as T
}

export function fetchAll(): Promise<{
  cemeteries: Cemetery[]
  plots: Plot[]
  reservations: Reservation[]
  clients: Client[]
  payments: Payment[]
  agreements: Agreement[]
  activities: Activity[]
  notifications: AppNotification[]
  reports: GeneratedReport[]
}> {
  return Promise.all([
    apiGet<Cemetery[]>("/cemeteries"),
    apiGet<Plot[]>("/plots"),
    apiGet<Reservation[]>("/reservations"),
    apiGet<Client[]>("/clients"),
    apiGet<Payment[]>("/payments"),
    apiGet<Agreement[]>("/agreements"),
    apiGet<Activity[]>("/activities"),
    apiGet<AppNotification[]>("/notifications"),
    apiGet<GeneratedReport[]>("/reports"),
  ]).then(
    ([
      cemeteries,
      plots,
      reservations,
      clients,
      payments,
      agreements,
      activities,
      notifications,
      reports,
    ]) => ({
      cemeteries,
      plots,
      reservations,
      clients,
      payments,
      agreements,
      activities,
      notifications,
      reports,
    })
  )
}

export function fetchNotifications(): Promise<AppNotification[]> {
  return apiGet<AppNotification[]>("/notifications")
}

export function fetchAttachments(reservationId: string): Promise<Attachment[]> {
  return apiGet<Attachment[]>(`/reservations/${reservationId}/attachments`)
}

/** Uploads a file to the `assets` bucket via the API function. */
export async function uploadAttachment(
  reservationId: string,
  file: File
): Promise<Attachment> {
  const form = new FormData()
  form.append("file", file)
  const res = await fetch(`${BASE}/reservations/${reservationId}/attachments`, {
    method: "POST",
    headers: { Authorization: await authHeader() },
    body: form,
  })
  if (!res.ok) throw new Error(`upload → ${res.status}`)
  return (await res.json()) as Attachment
}

/* ---------------- staff accounts (admin only) ---------------- */

export interface StaffUser {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
}

export async function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: await authHeader(),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      (payload as { error?: string }).error ??
      `${method} ${path} → ${res.status}`
    throw new Error(message)
  }
  return payload as T
}

export function fetchStaff(): Promise<StaffUser[]> {
  return apiGet<StaffUser[]>("/staff")
}

export function createStaff(input: {
  name: string
  email: string
  password: string
  role: "staff" | "admin" | "client"
}): Promise<StaffUser> {
  return apiSend<StaffUser>("POST", "/staff", input)
}

export function deleteStaff(id: string): Promise<{ ok: boolean }> {
  return apiSend<{ ok: boolean }>("DELETE", `/staff/${id}`)
}

export function deleteAttachment(id: string): Promise<{ ok: boolean }> {
  return apiSend<{ ok: boolean }>("DELETE", `/attachments/${id}`)
}

/* --------------------- creates (dashboard quick actions) ------------------- */

export interface NewClient {
  fullName: string
  contactNumber: string
  email: string
  type: Client["type"]
  status: Client["status"]
}

export interface NewPlot {
  cemeteryId: string
  section: string
  row: number
  column: number
  size: string
  price: number
  status: Plot["status"]
  type?: Plot["type"]
  groupName?: string
}

export interface NewReservation {
  clientId: string
  plotId: string
  date: string
  plotCategory: Reservation["plotCategory"]
}

export interface NewPayment {
  clientId: string
  plotId: string
  type: Payment["type"]
  amount: number
  method: Payment["method"]
  status: Payment["status"]
  date: string
}

/** Portal credentials the API auto-provisions with each new client record. */
export interface ClientPortalProvision {
  email: string
  /** One-time password for the family's first sign-in at /client/login. */
  tempPassword?: string
  /** Set when account creation failed — the client row still exists. */
  error?: string
}

export function createClient(
  input: NewClient
): Promise<Client & { portal: ClientPortalProvision }> {
  return apiSend<Client & { portal: ClientPortalProvision }>(
    "POST",
    "/clients",
    input
  )
}

export function createPlot(input: NewPlot): Promise<Plot> {
  return apiSend<Plot>("POST", "/plots", input)
}

/** Rectangular block of plots for one cemetery (the grid builder). */
export interface NewPlotGrid {
  cemeteryId: string
  sections: string[]
  rows: number
  columns: number
  startRow: number
  startColumn: number
  size: string
  price: number
  status: Plot["status"]
  type?: Plot["type"]
}

/** Creates every missing cell in a grid; existing plots are reported as skipped. */
export function createPlotGrid(
  input: NewPlotGrid
): Promise<{ created: Plot[]; skipped: number }> {
  return apiSend("POST", "/plots/grid", input)
}

/** Booking the plot server-side; returns the row plus the records it touched. */
export function createReservation(
  input: NewReservation
): Promise<{ reservation: Reservation; plot: Plot; client: Client }> {
  return apiSend("POST", "/reservations", input)
}

export function createPayment(input: NewPayment): Promise<Payment> {
  return apiSend<Payment>("POST", "/payments", input)
}

export function createReport(input: {
  name?: string
  type: string
}): Promise<GeneratedReport> {
  return apiSend<GeneratedReport>("POST", "/reports", input)
}

/* ---------------------- edits and deletes (per row) ----------------------- */

export function updateClient(
  id: string,
  input: Partial<NewClient>
): Promise<Client> {
  return apiSend<Client>("PATCH", `/clients/${id}`, input)
}

export function deleteClient(id: string): Promise<{ ok: boolean }> {
  return apiSend<{ ok: boolean }>("DELETE", `/clients/${id}`)
}

export function updatePlot(
  id: string,
  input: Partial<Omit<NewPlot, "cemeteryId" | "section" | "row" | "column">> & {
    reservedFor?: string
  }
): Promise<Plot> {
  return apiSend<Plot>("PATCH", `/plots/${id}`, input)
}

export function deletePlot(id: string): Promise<{ ok: boolean }> {
  return apiSend<{ ok: boolean }>("DELETE", `/plots/${id}`)
}

/** Applies one group/category to several plots and returns the updated rows. */
export interface PlotPlacement {
  id: string
  row: number
  column: number
}

export function groupPlots(
  ids: string[],
  input: {
    groupName?: string
    type?: Plot["type"]
    placements?: PlotPlacement[]
  }
): Promise<Plot[]> {
  return apiSend<Plot[]>("PATCH", "/plots/group", { ids, ...input })
}

export interface EditReservation {
  date?: string
  plotCategory?: Reservation["plotCategory"]
  status?: Reservation["status"]
  verification?: Reservation["verification"]
}

export function updateReservation(
  id: string,
  input: EditReservation
): Promise<Reservation> {
  return apiSend<Reservation>("PATCH", `/reservations/${id}`, input)
}

/** Deleting a booking also releases the plot; returns the rows it touched. */
export function deleteReservation(id: string): Promise<{
  ok: boolean
  plot: Plot | null
  client: Client | null
}> {
  return apiSend("DELETE", `/reservations/${id}`)
}

export function updatePayment(
  id: string,
  input: Partial<Omit<NewPayment, "clientId" | "plotId">>
): Promise<Payment> {
  return apiSend<Payment>("PATCH", `/payments/${id}`, input)
}

export function deletePayment(id: string): Promise<{ ok: boolean }> {
  return apiSend<{ ok: boolean }>("DELETE", `/payments/${id}`)
}

export interface EditAgreement {
  type?: Agreement["type"]
  dateSigned?: string
  status?: Agreement["status"]
}

export function updateAgreement(
  id: string,
  input: EditAgreement
): Promise<Agreement> {
  return apiSend<Agreement>("PATCH", `/agreements/${id}`, input)
}

export function deleteAgreement(id: string): Promise<{ ok: boolean }> {
  return apiSend<{ ok: boolean }>("DELETE", `/agreements/${id}`)
}

export interface EditReport {
  name?: string
  type?: string
  status?: GeneratedReport["status"]
}

export function updateReport(
  id: string,
  input: EditReport
): Promise<GeneratedReport> {
  return apiSend<GeneratedReport>("PATCH", `/reports/${id}`, input)
}

export function deleteReport(id: string): Promise<{ ok: boolean }> {
  return apiSend<{ ok: boolean }>("DELETE", `/reports/${id}`)
}

export interface EditNotification {
  read?: boolean
}

export function updateNotification(
  id: string,
  input: EditNotification
): Promise<AppNotification> {
  return apiSend<AppNotification>("PATCH", `/notifications/${id}`, input)
}

export function deleteNotification(id: string): Promise<{ ok: boolean }> {
  return apiSend<{ ok: boolean }>("DELETE", `/notifications/${id}`)
}
