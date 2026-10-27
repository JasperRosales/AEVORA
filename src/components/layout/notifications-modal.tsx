import { useState } from "react"
import { BellOff, CheckCheck, Mail, MailOpen, Trash2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import {
  removeNotification,
  updateNotificationRow,
  updateNotificationRows,
} from "@/data/store"
import { deleteNotification, updateNotification } from "@/lib/neon-api"
import type { AppNotification } from "@/types/domain"

const ACTION =
  "inline-flex items-center gap-1 rounded-lg border border-deep/20 px-2.5 py-1 text-[11px] font-medium text-deep transition hover:bg-navy/10 disabled:cursor-not-allowed disabled:opacity-50"
const DANGER =
  "inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-[11px] font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
const PRIMARY =
  "rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function isMissingNotification(err: unknown): boolean {
  return errorMessage(err).includes("→ 404")
}

/**
 * Header notification centre. Rows can be marked read/unread or deleted, and
 * "Mark all read" applies the change to every unread notification. Each action
 * PATCHes/DELETEs the row and mirrors the response into the shared store, so
 * the header badge and the Overview notifications card update immediately.
 */
export function NotificationsModal({
  notifications,
  onClose,
}: {
  notifications: AppNotification[]
  onClose: () => void
}) {
  const [pending, setPending] = useState<{
    id: string
    action: "read" | "delete"
  } | null>(null)
  const [pendingAll, setPendingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const busy = pending !== null || pendingAll
  const unreadCount = notifications.filter((n) => !n.read).length
  const ordered = [...notifications].sort((a, b) =>
    b.dateTime.localeCompare(a.dateTime)
  )

  async function toggleRead(notification: AppNotification) {
    if (busy) return
    setPending({ id: notification.id, action: "read" })
    setError(null)
    try {
      const updated = await updateNotification(notification.id, {
        read: !notification.read,
      })
      updateNotificationRow(updated)
    } catch (err) {
      if (isMissingNotification(err)) {
        removeNotification(notification.id)
        setError("That notification is no longer available and was removed.")
      } else {
        setError(errorMessage(err))
      }
    } finally {
      setPending(null)
    }
  }

  async function remove(notification: AppNotification) {
    if (busy) return
    setPending({ id: notification.id, action: "delete" })
    setError(null)
    try {
      await deleteNotification(notification.id)
      removeNotification(notification.id)
    } catch (err) {
      if (isMissingNotification(err)) {
        removeNotification(notification.id)
        setError("That notification was already removed.")
      } else {
        setError(errorMessage(err))
      }
    } finally {
      setPending(null)
    }
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read)
    if (busy || unread.length === 0) return
    setPendingAll(true)
    setError(null)
    try {
      const results = await Promise.allSettled(
        unread.map((n) => updateNotification(n.id, { read: true }))
      )
      const updated: AppNotification[] = []
      let missing = false
      for (const [index, result] of results.entries()) {
        if (result.status === "fulfilled") {
          updated.push(result.value)
        } else if (isMissingNotification(result.reason)) {
          removeNotification(unread[index].id)
          missing = true
        } else {
          throw result.reason
        }
      }
      updateNotificationRows(updated)
      if (missing) {
        setError("Some notifications were already removed.")
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setPendingAll(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Notifications"
      description={
        notifications.length === 0
          ? "No notifications yet."
          : unreadCount > 0
            ? `${unreadCount} unread of ${notifications.length}`
            : "All caught up"
      }
      footer={
        <>
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={busy || unreadCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-deep transition hover:bg-navy/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={14} />
            {pendingAll ? "Marking..." : "Mark all read"}
          </button>
          <button type="button" onClick={onClose} className={PRIMARY}>
            Close
          </button>
        </>
      }
    >
      <div className="mx-auto max-w-2xl space-y-3">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {ordered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <BellOff size={28} className="text-deep/30" />
            <p className="text-sm text-deep/60">
              No notifications. You&apos;re all caught up.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {ordered.map((notification) => {
              const updating =
                pending?.id === notification.id && pending.action === "read"
              const deleting =
                pending?.id === notification.id && pending.action === "delete"

              return (
                <li
                  key={notification.id}
                  className={`rounded-xl border p-3 transition-colors ${
                    notification.read
                      ? "border-deep/10 bg-cream/30"
                      : "border-teal/30 bg-teal/10"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.read ? "bg-deep/20" : "bg-teal"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm ${
                          notification.read
                            ? "text-deep/65"
                            : "font-medium text-deep"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="mt-0.5 text-[11px] text-deep/50">
                        {notification.dateTime} ·{" "}
                        <span className="uppercase">{notification.type}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleRead(notification)}
                      disabled={busy}
                      className={ACTION}
                    >
                      {notification.read ? (
                        <Mail size={12} />
                      ) : (
                        <MailOpen size={12} />
                      )}
                      {updating
                        ? "Updating..."
                        : notification.read
                          ? "Mark unread"
                          : "Mark read"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(notification)}
                      disabled={busy}
                      aria-label={`Delete notification: ${notification.message}`}
                      className={DANGER}
                    >
                      <Trash2 size={12} />
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
