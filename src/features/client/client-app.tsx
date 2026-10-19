import { ClipboardList, CreditCard, Home, LogOut, User } from "lucide-react"
import { useEffect, useState } from "react"
import { signOut, useSession } from "@/data/session"
import { ensureClientDataLoaded } from "@/data/client-store"
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

  useEffect(() => {
    ensureClientDataLoaded()
  }, [])

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col bg-cream">
      {/* Top app bar */}
      <header className="sticky top-0 z-10 bg-navy px-4 py-3 text-cream shadow-md">
        <div className="flex items-center gap-3">
          <img src="/aevora-icon.ico" alt="" className="h-9 w-9 rounded-xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-tight font-bold">Aevora</p>
            <p className="truncate text-[11px] text-cream/60">
              {user?.name ?? "Client Portal"}
            </p>
          </div>
          <button
            onClick={() => void signOut()}
            aria-label="Sign out"
            className="rounded-full p-2.5 text-cream/80 transition hover:bg-white/10 active:bg-white/20"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <main className="flex-1 overflow-y-auto p-4 pb-28">
        {tab === "home" && <HomeTab onOpenReservations={() => setTab("reservations")} />}
        {tab === "reservations" && <ReservationsTab />}
        {tab === "payments" && <PaymentsTab />}
        {tab === "profile" && <ProfileTab />}
      </main>

      {/* Bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-deep/10 bg-white/95 backdrop-blur"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-4">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-current={tab === id}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
                tab === id ? "text-navy" : "text-deep/50"
              }`}
            >
              <Icon size={20} strokeWidth={tab === id ? 2.4 : 1.8} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
