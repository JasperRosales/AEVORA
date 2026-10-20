import type { DataState } from "@/data/store"
import { formatCurrency } from "@/lib/format"
import type { ReportType } from "./overview-action-modals"

/**
 * Analytics behind the Overview report tiles.
 *
 * A report is a summary (chips of headline numbers), a breakdown (label/value
 * rows with counts and shares) and a detail table — all computed client-side
 * from the shared staff store, matching how the Reports page derives its charts.
 * The same numbers are what the CSV download writes out.
 */

export interface ReportTable {
  columns: string[]
  rows: (string | number)[][]
}

export interface ReportSection {
  label: string
  value: string
}

export interface Report {
  type: ReportType
  /** Headline numbers, e.g. total plots and occupancy rate. */
  summary: ReportSection[]
  /** Grouped counts with a share of the total. */
  breakdown: ReportSection[]
  table: ReportTable
}

/** Report types that can be generated, in tile order. */
export const REPORT_TYPES: ReportType[] = [
  "Plot Occupancy",
  "Reservations",
  "Clients",
  "Payments",
  "Agreements",
  "Information Checking",
]

const PLOT_STATUS_ORDER = [
  "Available",
  "Reserved",
  "Occupied",
  "Waiting for Checking",
  "Unavailable",
]

const RESERVATION_STATUS_ORDER = [
  "Pending",
  "Under Verification",
  "Confirmed",
  "Cancelled",
]

const VERIFICATION_ORDER = [
  "Waiting for Checking",
  "Under Review",
  "Verified",
  "Requires Action",
]

/** Percentage helper: `part` of `total`, rounded (0 when there is nothing). */
function share(part: number, total: number): string {
  return `${Math.round((part / (total || 1)) * 100)}%`
}

/**
 * Cemetery display name from the report's own dataset. The shared
 * `cemeteryName()` helper reads the live store, which would make a snapshot
 * report disagree with the rows it was built from.
 */
function nameOf(cemeteries: DataState["cemeteries"], id: string): string {
  return cemeteries.find((c) => c.id === id)?.name ?? id
}

/** Counts of each value of `key` across `rows`, in `order` then by name. */
function tally<T>(
  rows: T[],
  key: (row: T) => string,
  order: string[]
): ReportSection[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const value = key(row)
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  const extra = [...counts.keys()].filter((k) => !order.includes(k)).sort()
  return [...order, ...extra]
    .filter((label) => counts.has(label))
    .map((label) => ({
      label,
      value: `${counts.get(label)} · ${share(counts.get(label) ?? 0, rows.length)}`,
    }))
}

export function buildReport(type: ReportType, data: DataState): Report {
  switch (type) {
    case "Clients":
      return buildClientsReport(data)
    case "Payments":
      return buildPaymentsReport(data)
    case "Agreements":
      return buildAgreementsReport(data)
    case "Reservations":
      return buildReservationsReport(data)
    case "Information Checking":
      return buildInformationCheckingReport(data)
    case "Plot Occupancy":
      return buildPlotOccupancyReport(data)
  }
}

/* ------------------------------ Plot Occupancy ----------------------------- */

function buildPlotOccupancyReport(data: DataState): Report {
  const { plots, cemeteries } = data
  const occupied = plots.filter((p) => p.status === "Occupied").length
  const reserved = plots.filter((p) => p.status === "Reserved").length
  const occupancyRate = Math.round(
    ((occupied + reserved) / (plots.length || 1)) * 100
  )

  const byCemetery = cemeteries
    .map((cemetery) => {
      const rows = plots.filter((p) => p.cemeteryId === cemetery.id)
      const occ = rows.filter((p) => p.status === "Occupied").length
      const res = rows.filter((p) => p.status === "Reserved").length
      return {
        name: cemetery.name,
        total: rows.length,
        available: rows.filter((p) => p.status === "Available").length,
        reserved: res,
        occupied: occ,
        waiting: rows.filter((p) => p.status === "Waiting for Checking").length,
        unavailable: rows.filter((p) => p.status === "Unavailable").length,
        rate: Math.round(((occ + res) / (rows.length || 1)) * 100),
      }
    })
    .sort((a, b) => b.total - a.total)

  return {
    type: "Plot Occupancy",
    summary: [
      { label: "Total plots", value: String(plots.length) },
      { label: "Occupied", value: String(occupied) },
      { label: "Reserved", value: String(reserved) },
      { label: "Occupancy rate", value: `${occupancyRate}%` },
    ],
    breakdown: tally(plots, (p) => p.status, PLOT_STATUS_ORDER),
    table: {
      columns: [
        "Cemetery",
        "Total",
        "Available",
        "Reserved",
        "Occupied",
        "Waiting",
        "Unavailable",
        "Occupancy",
      ],
      rows: byCemetery.map((c) => [
        c.name,
        c.total,
        c.available,
        c.reserved,
        c.occupied,
        c.waiting,
        c.unavailable,
        `${c.rate}%`,
      ]),
    },
  }
}

/* -------------------------------- Reservations ----------------------------- */

function buildReservationsReport(data: DataState): Report {
  const { cemeteries, reservations } = data
  const confirmed = reservations.filter((r) => r.status === "Confirmed").length
  const pending = reservations.filter((r) => r.status === "Pending").length

  const byCemetery = new Map<string, { total: number; confirmed: number }>()
  for (const r of reservations) {
    const entry = byCemetery.get(r.cemeteryId) ?? { total: 0, confirmed: 0 }
    entry.total += 1
    if (r.status === "Confirmed") entry.confirmed += 1
    byCemetery.set(r.cemeteryId, entry)
  }

  return {
    type: "Reservations",
    summary: [
      { label: "Total reservations", value: String(reservations.length) },
      { label: "Confirmed", value: String(confirmed) },
      { label: "Pending", value: String(pending) },
      {
        label: "Confirmation rate",
        value: share(confirmed, reservations.length),
      },
    ],
    breakdown: tally(reservations, (r) => r.status, RESERVATION_STATUS_ORDER),
    table: {
      columns: ["Cemetery", "Reservations", "Confirmed", "Confirmation rate"],
      rows: [...byCemetery.entries()]
        .map(([id, entry]) => [
          nameOf(cemeteries, id),
          entry.total,
          entry.confirmed,
          share(entry.confirmed, entry.total),
        ])
        .sort((a, b) => Number(b[1]) - Number(a[1])),
    },
  }
}

/* ---------------------------------- Clients -------------------------------- */

function buildClientsReport(data: DataState): Report {
  const { clients, reservations } = data
  const active = clients.filter((c) => c.status === "Active").length
  const bookings = clients.reduce((sum, c) => sum + c.reservations, 0)
  const byType = tally(clients, (c) => c.type, ["Individual", "Corporate"])

  const topBookers = clients
    .slice()
    .sort(
      (a, b) =>
        b.reservations - a.reservations || a.fullName.localeCompare(b.fullName)
    )
    .slice(0, 10)

  return {
    type: "Clients",
    summary: [
      { label: "Total clients", value: String(clients.length) },
      {
        label: "Active",
        value: `${active} · ${share(active, clients.length)}`,
      },
      {
        label: "Individual / Corporate",
        value: `${byType[0]?.value.split(" · ")[0] ?? 0} / ${byType[1]?.value.split(" · ")[0] ?? 0}`,
      },
      {
        label: "Reservations booked",
        value: `${bookings} of ${reservations.length}`,
      },
    ],
    breakdown: tally(clients, (c) => c.status, [
      "Active",
      "Pending",
      "Inactive",
    ]),
    table: {
      columns: [
        "Client",
        "Client ID",
        "Type",
        "Status",
        "Registered",
        "Reservations",
      ],
      rows: topBookers.map((c) => [
        c.fullName,
        c.clientId,
        c.type,
        c.status,
        c.registeredAt,
        c.reservations,
      ]),
    },
  }
}

/* --------------------------------- Payments -------------------------------- */

function buildPaymentsReport(data: DataState): Report {
  const { payments } = data
  const total = (status: string) =>
    payments
      .filter((p) => p.status === status)
      .reduce((sum, p) => sum + p.amount, 0)
  const collected = total("Paid")
  const outstanding = total("Pending") + total("Overdue")

  const byMethod = tally(payments, (p) => p.method, [
    "Cash",
    "Bank Transfer",
    "Card",
    "Online",
  ])

  return {
    type: "Payments",
    summary: [
      { label: "Transactions", value: String(payments.length) },
      { label: "Collected", value: formatCurrency(collected) },
      { label: "Outstanding", value: formatCurrency(outstanding) },
      {
        label: "Collection rate",
        value: share(collected, collected + outstanding),
      },
    ],
    breakdown: [
      ...tally(payments, (p) => p.status, ["Paid", "Pending", "Overdue"]),
      ...byMethod,
    ],
    table: {
      columns: ["Status", "Transactions", "Amount"],
      rows: ["Paid", "Pending", "Overdue"].map((status) => [
        status,
        payments.filter((p) => p.status === status).length,
        formatCurrency(total(status)),
      ]),
    },
  }
}

/* -------------------------------- Agreements ------------------------------- */

function buildAgreementsReport(data: DataState): Report {
  const { agreements, cemeteries } = data
  const active = agreements.filter((a) => a.status === "Active").length

  return {
    type: "Agreements",
    summary: [
      { label: "Total agreements", value: String(agreements.length) },
      {
        label: "Active",
        value: `${active} · ${share(active, agreements.length)}`,
      },
      {
        label: "Completed",
        value: String(
          agreements.filter((a) => a.status === "Completed").length
        ),
      },
      {
        label: "Pending",
        value: String(agreements.filter((a) => a.status === "Pending").length),
      },
    ],
    breakdown: [
      ...tally(agreements, (a) => a.status, [
        "Pending",
        "Active",
        "Completed",
        "Cancelled",
      ]),
      ...tally(agreements, (a) => a.type, [
        "Reservation Agreement",
        "Deed of Sale",
        "Maintenance Agreement",
      ]),
    ],
    table: {
      columns: [
        "Agreement",
        "Client",
        "Plot",
        "Cemetery",
        "Type",
        "Signed",
        "Status",
      ],
      rows: agreements.map((a) => [
        a.agreementNumber,
        a.clientName,
        a.plotNumber,
        nameOf(cemeteries, a.cemeteryId),
        a.type,
        a.dateSigned,
        a.status,
      ]),
    },
  }
}

/* --------------------------- Information Checking -------------------------- */

function buildInformationCheckingReport(data: DataState): Report {
  const { cemeteries, reservations } = data
  const awaiting = reservations.filter((r) => r.verification !== "Verified")
  const verified = reservations.length - awaiting.length

  return {
    type: "Information Checking",
    summary: [
      { label: "Awaiting verification", value: String(awaiting.length) },
      {
        label: "Verified",
        value: `${verified} · ${share(verified, reservations.length)}`,
      },
      {
        label: "Requires action",
        value: String(
          reservations.filter((r) => r.verification === "Requires Action")
            .length
        ),
      },
      { label: "Reservations tracked", value: String(reservations.length) },
    ],
    breakdown: tally(reservations, (r) => r.verification, VERIFICATION_ORDER),
    table: {
      columns: [
        "Reference",
        "Client",
        "Cemetery",
        "Plot",
        "Submitted",
        "Verification",
        "Status",
      ],
      rows: awaiting.map((r) => [
        r.reservationNumber,
        r.clientName,
        nameOf(cemeteries, r.cemeteryId),
        r.plotNumber,
        r.date,
        r.verification,
        r.status,
      ]),
    },
  }
}

/* --------------------------------- CSV export ------------------------------ */

/** Wraps a cell in quotes when it contains a comma, quote or newline. */
function csvCell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** The report's detail table as CSV text. */
export function reportToCsv(report: Report): string {
  const [header, ...body] = [report.table.columns, ...report.table.rows]
  return [header, ...body].map((row) => row.map(csvCell).join(",")).join("\n")
}

/** Downloads the report's detail table as a CSV file. */
export function downloadReportCsv(report: Report) {
  downloadFile(
    `${report.type.toLowerCase().replace(/\s+/g, "-")}-report-${new Date().toISOString().slice(0, 10)}.csv`,
    reportToCsv(report),
    "text/csv;charset=utf-8"
  )
}

/** Triggers a client-side file download from in-memory content. */
export function downloadFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
