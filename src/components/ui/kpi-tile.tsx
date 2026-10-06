import type { LucideIcon } from "lucide-react"

export function KpiTile({
  label,
  value,
  icon: Icon,
  sub,
  trend,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  sub?: string
  trend?: { up: boolean; text: string }
}) {
  return (
    <div className="neu relative flex items-center p-4">
      <span className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-navy text-cream shadow-[3px_3px_0_rgba(6,22,51,0.3),inset_1px_1px_2px_rgba(255,255,255,0.35)]">
        <Icon size={20} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 pl-12">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`${label === "Waiting for Checking" ? "text-[8px]" : "text-[10px]"} tracking-tight whitespace-nowrap text-deep uppercase`}
          >
            {label}
          </p>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-[11px] text-deep">{sub}</p>}
        {trend && (
          <p
            className={`text-[11px] font-semibold ${trend.up ? "text-teal" : "text-red-600"}`}
          >
            {trend.up ? "▲" : "▼"} {trend.text} vs last month
          </p>
        )}
      </div>
    </div>
  )
}
