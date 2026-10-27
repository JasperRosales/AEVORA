import { useState } from "react"
import { Bell, LogOut } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { signOut, useSession } from "@/data/session"
import { useData } from "@/data/store"
import { EASE_OUT, layoutSpring } from "@/lib/motion"
import { NotificationsModal } from "./notifications-modal"

export function Header({ title }: { title: string }) {
  const { notifications } = useData()
  const { user } = useSession()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const unreadCount = notifications.filter((n) => !n.read).length
  const initials = (user?.name ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="flex items-center gap-4 bg-cream/90 px-6 py-3 shadow-[0_6px_16px_rgba(12,44,85,0.08)] backdrop-blur"
    >
      <div className="min-w-48">
        <p className="text-xs text-deep">Current page</p>
        <div className="relative h-7 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.h1
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="text-lg font-semibold"
            >
              {title}
            </motion.h1>
          </AnimatePresence>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-5">
        <motion.button
          type="button"
          onClick={() => setNotificationsOpen(true)}
          aria-label={
            unreadCount > 0
              ? `Notifications, ${unreadCount} unread`
              : "Notifications"
          }
          aria-haspopup="dialog"
          whileHover={{ scale: 1.12, rotate: -6 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
          className="relative cursor-pointer rounded-full p-1.5 text-deep transition-colors hover:bg-navy/10"
          title={
            unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
              : "No unread notifications"
          }
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={layoutSpring}
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
            >
              {unreadCount}
            </motion.span>
          )}
        </motion.button>
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE_OUT }}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-deep text-sm font-bold text-cream">
            {initials}
          </div>
          <div>
            <p className="text-sm leading-tight font-medium">
              {user?.name ?? "Signed in"}{" "}
              <span className="text-xs text-deep/50">({user?.role})</span>
            </p>
            <button
              onClick={() => void signOut()}
              className="flex items-center gap-1 text-xs text-navy/70 hover:underline"
            >
              <LogOut size={11} /> Logout
            </button>
          </div>
        </motion.div>
      </div>

      {notificationsOpen && (
        <NotificationsModal
          notifications={notifications}
          onClose={() => setNotificationsOpen(false)}
        />
      )}
    </motion.header>
  )
}
