import type { LucideIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { EASE_OUT, staggerItem } from "@/lib/motion"

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
    <motion.div
      variants={staggerItem}
      className="neu relative flex items-center p-4"
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: EASE_OUT }}
        className="absolute top-1/2 left-3 flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-navy text-cream shadow-[3px_3px_0_rgba(6,22,51,0.3),inset_1px_1px_2px_rgba(255,255,255,0.35)]"
      >
        <Icon size={20} strokeWidth={2} />
      </motion.span>
      <div className="min-w-0 flex-1 pl-12">
        <div className="flex items-center justify-between gap-2">
          <p
            className={`${label === "Waiting for Checking" ? "text-[8px]" : "text-[10px]"} tracking-tight whitespace-nowrap text-deep uppercase`}
          >
            {label}
          </p>
        </div>
        <p className="text-2xl font-bold">
          <AnimatedValue value={value} />
        </p>
        {sub && <p className="text-[11px] text-deep">{sub}</p>}
        {trend && (
          <p
            className={`text-[11px] font-semibold ${trend.up ? "text-teal" : "text-red-600"}`}
          >
            {trend.up ? "▲" : "▼"} {trend.text} vs last month
          </p>
        )}
      </div>
    </motion.div>
  )
}

/**
 * Rolls the digits when a tile's value changes (e.g. after switching the
 * cemetery filter) instead of hard-swapping the text.
 */
function AnimatedValue({ value }: { value: string | number }) {
  const text = String(value)
  return (
    <span className="relative inline-flex overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          initial={{ y: "70%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-70%", opacity: 0 }}
          transition={{ duration: 0.26, ease: EASE_OUT }}
          className="whitespace-nowrap"
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
