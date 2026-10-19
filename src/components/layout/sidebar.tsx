import { motion } from "motion/react"
import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  FileText,
  LayoutDashboard,
  Map,
  LayoutGrid,
  Users,
} from "lucide-react"
import { EASE_OUT, layoutSpring, stagger, staggerItem } from "@/lib/motion"

export type Page =
  | "Overview"
  | "Cemetery Map"
  | "Plots"
  | "Reservations"
  | "Clients"
  | "Payments"
  | "Agreements"
  | "Reports"

const pages: { name: Page; icon: typeof Map }[] = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Cemetery Map", icon: Map },
  { name: "Plots", icon: LayoutGrid },
  { name: "Reservations", icon: CalendarCheck },
  { name: "Clients", icon: Users },
  { name: "Payments", icon: CreditCard },
  { name: "Agreements", icon: FileText },
  { name: "Reports", icon: BarChart3 },
]

export function Sidebar({
  active,
  onNavigate,
  onPrefetch,
}: {
  active: Page
  onNavigate: (page: Page) => void
  /** Warms the page's code chunk before it is clicked (hover/keyboard focus). */
  onPrefetch?: (page: Page) => void
}) {
  return (
    <motion.aside
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-navy p-4 text-cream shadow-xl"
    >
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="mb-8 flex items-center gap-2 px-2"
      >
        <img
          src="/aevora-icon.ico"
          alt="Aevora logo"
          className="h-10 w-10 rounded-lg"
        />
        <div>
          <span className="text-lg font-bold tracking-wide">Aevora</span>
          <p className="text-[10px] text-cream/50">Cemetery System</p>
        </div>
      </motion.div>
      <motion.nav
        variants={stagger(0.045, 0.08)}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-1"
      >
        {pages.map(({ name, icon: Icon }) => {
          const isActive = active === name
          return (
            <motion.button
              key={name}
              variants={staggerItem}
              onClick={() => onNavigate(name)}
              onMouseEnter={() => onPrefetch?.(name)}
              onFocus={() => onPrefetch?.(name)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
              className={`relative flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-200 ${
                isActive ? "text-cream" : "text-cream/70 hover:bg-white/5"
              }`}
            >
              {/* Shared pill glides to the newly active entry. */}
              {isActive && (
                <motion.span
                  layoutId="sidebar-active"
                  transition={layoutSpring}
                  className="absolute inset-0 rounded-xl bg-white/10 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.06)]"
                />
              )}
              <span className="relative z-10 flex items-center gap-3">
                <motion.span
                  animate={{ scale: isActive ? 1.08 : 1 }}
                  transition={{ duration: 0.22, ease: EASE_OUT }}
                  className="flex"
                >
                  <Icon size={18} />
                </motion.span>
                {name}
              </span>
            </motion.button>
          )
        })}
      </motion.nav>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-auto px-2 text-[10px] leading-relaxed text-cream/50"
      >
        Batangas State University — The National Engineering University
      </motion.p>
    </motion.aside>
  )
}
