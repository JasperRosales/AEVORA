import { ClipboardList, CreditCard, Home, LogOut, User } from "lucide-react"
import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { signOut, useSession } from "@/data/session"
import { ensureClientDataLoaded } from "@/data/client-store"
import { EASE_OUT, layoutSpring } from "@/lib/motion"
import { HomeTab } from "./client-home-tab"
import { PaymentsTab } from "./client-payments-tab"
import { ProfileTab } from "./client-profile-tab"
import { ReservationsTab } from "./client-reservations-tab"

/**
 * Aevora Client Portal — the mobile-first side of the app for families with a
 * reservation. Signed-in clients (role "client") land here instead of the
 * staff dashboard (see App.tsx). Designed phone-first: single column, bottom
 * tab bar, 44px touch targets; centered max-w-md column on desktop.
 */
type Tab = "home" | "reservations" | "payments" | "profile"

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "reservations", label: "Reservations", icon: ClipboardList },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "profile", label: "Profile", icon: User },
]

export function ClientApp() {
  const { user } = useSession()
  const [tab, setTab] = useState<Tab>("home")
  // Drives the slide direction of the tab transition (new tab in from its side).
  const [direction, setDirection] = useState(1)

  function selectTab(next: Tab) {
    if (next === tab) return
    const from = TABS.findIndex((t) => t.id === tab)
    const to = TABS.findIndex((t) => t.id === next)
    setDirection(to > from ? 1 : -1)
    setTab(next)
  }

  useEffect(() => {
    ensureClientDataLoaded()
  }, [])

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-cream">
      {/* Top app bar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="sticky top-0 z-10 bg-navy px-4 py-3 text-cream shadow-md"
      >
        <div className="flex items-center gap-3">
          <motion.img
            src="/aevora-icon.ico"
            alt=""
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 20,
              delay: 0.08,
            }}
            className="h-9 w-9 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight font-bold">Aevora</p>
            <p className="truncate text-[11px] text-cream/60">
              {user?.name ?? "Client Portal"}
            </p>
          </div>
          <motion.button
            onClick={() => void signOut()}
            aria-label="Sign out"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            className="rounded-full p-2.5 text-cream/80 transition hover:bg-white/10 active:bg-white/20"
          >
            <LogOut size={18} />
          </motion.button>
        </div>
      </motion.header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 pb-28">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={tab}
            custom={direction}
            initial={{ opacity: 0, x: 24 * direction }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 * direction }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
          >
            {tab === "home" && (
              <HomeTab onOpenReservations={() => selectTab("reservations")} />
            )}
            {tab === "reservations" && <ReservationsTab />}
            {tab === "payments" && <PaymentsTab />}
            {tab === "profile" && <ProfileTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-deep/10 bg-white/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id
            return (
              <motion.button
                key={id}
                onClick={() => selectTab(id)}
                aria-current={isActive}
                whileTap={{ scale: 0.94 }}
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  isActive ? "text-navy" : "text-deep/50"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="client-tab-indicator"
                    transition={layoutSpring}
                    className="absolute inset-x-3 inset-y-1.5 rounded-xl bg-navy/5"
                  />
                )}
                <motion.span
                  className="relative z-10 flex flex-col items-center gap-0.5"
                  animate={{ y: isActive ? -1 : 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                  {label}
                </motion.span>
              </motion.button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
