import type { PlotStatus } from "@/types/domain"

/**
 * Single source of truth for status presentation.
 * Every status maps to one of four consistent color groups,
 * derived only from the Aevora palette (navy/deep/teal/cream).
 */

const positive = "bg-teal/30 text-deep" // success / confirmed / available
const inProgress = "bg-deep/15 text-deep" // pending / reserved / verification
const attention = "bg-navy text-cream" // needs action / rejected
const neutral = "bg-navy/10 text-navy/70" // inactive / muted states

export const statusBadgeStyles: Record<string, string> = {
  // Plots
  Available: "bg-green-100 text-green-800",
  Reserved: "bg-blue-100 text-blue-800",
  Occupied: "bg-red-100 text-red-800",
  "Waiting for Checking": "bg-yellow-100 text-yellow-800",
  Unavailable: "bg-gray-100 text-gray-500",
  // Reservations
  Pending: inProgress,
  "Under Verification": inProgress,
  Confirmed: positive,
  Cancelled: attention,
  // Verification
  "Under Review": inProgress,
  Verified: positive,
  "Requires Action": attention,
  // Payments
  Paid: positive,
  Overdue: attention,
  // Agreements / clients
  Active: positive,
  Inactive: neutral,
  Completed: "bg-teal/30 text-deep",
  // Reports
  Ready: positive,
  Processing: inProgress,
}

export function statusBadgeClass(status: string): string {
  return statusBadgeStyles[status] ?? neutral
}

export const plotStatusFill: Record<
  PlotStatus,
  { fill: string; fillOpacity?: number; stroke?: string }
> = {
  Available: { fill: "#16a34a" },
  Reserved: { fill: "#2563eb" },
  Occupied: { fill: "#dc2626" },
  "Waiting for Checking": { fill: "#eab308" },
  Unavailable: { fill: "#f8fafc", stroke: "#9ca3af" },
}
