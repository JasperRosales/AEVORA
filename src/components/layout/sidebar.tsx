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
}: {
  active: Page
  onNavigate: (page: Page) => void
}) {
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col bg-navy p-4 text-cream shadow-xl">
      <div className="mb-8 flex items-center gap-2 px-2">
        <img
          src="/aevora-icon.ico"
          alt="Aevora logo"
          className="h-9 w-9 rounded-lg ring-2 ring-teal/50"
        />
        <div>
          <span className="text-lg font-bold tracking-wide">Aevora</span>
          <p className="text-[10px] text-cream/50">Cemetery System</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {pages.map(({ name, icon: Icon }) => (
          <button
            key={name}
            onClick={() => onNavigate(name)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-all duration-200 ${
              active === name
                ? "bg-white/10 text-cream shadow-[inset_3px_3px_6px_rgba(0,0,0,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.06)]"
                : "text-cream/70 hover:translate-x-1 hover:bg-white/5"
            }`}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}
      </nav>
      <p className="mt-auto px-2 text-[10px] leading-relaxed text-cream/50">
        Batangas State University — The National Engineering University
      </p>
    </aside>
  )
}
