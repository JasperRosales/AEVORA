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
  Available: positive,
  Reserved: inProgress,
  Occupied: "bg-navy/80 text-cream",
  "Waiting for Checking": inProgress,
  Unavailable: "bg-navy/10 text-navy/60",
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
  Available: { fill: "var(--color-teal)" },
  Reserved: { fill: "var(--color-deep)" },
  Occupied: { fill: "var(--color-navy)" },
  "Waiting for Checking": { fill: "var(--color-teal)", fillOpacity: 0.45 },
  Unavailable: { fill: "var(--color-cream)", stroke: "var(--color-deep)" },
}
