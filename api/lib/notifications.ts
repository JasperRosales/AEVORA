import { randomUUID } from "node:crypto"
import { pool } from "../services/database"

/** Notification categories understood by the staff notification centre. */
export type NotificationType =
  "reservation" | "verification" | "payment" | "agreement" | "plot" | "account"

/** `YYYY-MM-DD HH:mm` in Philippine time, the format stored in `date_time`. */
const MANILA_TIME = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

function timestamp(date = new Date()): string {
  const parts = Object.fromEntries(
    MANILA_TIME.formatToParts(date).map(({ type, value }) => [type, value])
  )
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}

/** Writes a staff notification and propagates insert failures to the caller. */
export async function recordStaffNotification(
  message: string,
  type: NotificationType
): Promise<void> {
  await pool.query(
    `insert into notifications (id, message, type, date_time, is_read)
     values ($1, $2, $3, $4, false)`,
    [randomUUID(), message, type, timestamp()]
  )
}

/**
 * Records a best-effort staff notification for client actions that should not
 * fail when the notification feed is temporarily unavailable.
 */
export async function notifyStaff(
  message: string,
  type: NotificationType
): Promise<void> {
  try {
    await recordStaffNotification(message, type)
  } catch (error) {
    console.error("[notifications] failed to record staff notification:", error)
  }
}

/** Money formatting used inside notification messages (e.g. ₱12,500). */
export function pesos(amount: number): string {
  return `₱${Math.round(amount).toLocaleString("en-PH")}`
}
