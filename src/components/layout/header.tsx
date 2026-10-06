import { Bell, LogOut, Search } from "lucide-react"
import { notifications } from "@/data/mock"

export function Header({ title }: { title: string }) {
  return (
    <header className="flex items-center gap-4 bg-cream/90 px-6 py-3 shadow-[0_6px_16px_rgba(12,44,85,0.08)] backdrop-blur">
      <div>
        <p className="text-xs text-deep">Current page</p>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="relative ml-8">
        <Search
          size={15}
          className="absolute top-1/2 left-2.5 -translate-y-1/2 text-deep/60"
        />
        <input
          placeholder="Search records..."
          className="w-72 rounded-lg border border-deep/30 bg-cream py-1.5 pr-3 pl-8 text-sm transition outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
        />
      </div>
      <div className="ml-auto flex items-center gap-5">
        <div
          className="relative cursor-pointer transition-transform hover:scale-110"
          title={`${notifications.length} notifications`}
        >
          <Bell size={20} className="text-deep" />
          <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {notifications.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-deep text-sm font-bold text-cream">
            K
          </div>
          <div>
            <p className="text-sm leading-tight font-medium">Kyle (Admin)</p>
            <button className="flex items-center gap-1 text-xs text-navy/70 hover:underline">
              <LogOut size={11} /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
