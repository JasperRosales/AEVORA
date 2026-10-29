import { motion } from "motion/react"
import { EASE_OUT, stagger, staggerItem } from "@/lib/motion"

interface Segment {
  label: string
  value: number
  color: string
  opacity?: number
}

export function DonutChart({
  segments,
  centerLabel,
}: {
  segments: Segment[]
  centerLabel: string
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1
  const radius = 58
  const circumference = 2 * Math.PI * radius
  // Re-key the chart when the data changes so the arcs redraw on filter change.
  const signature = segments.map((s) => `${s.label}:${s.value}`).join("|")
  // Precompute each arc's length and start offset without mutating during render.
  const dashes = segments.map((s) => (s.value / total) * circumference)
  const offsets = dashes.map((_, i) =>
    dashes.slice(0, i).reduce((sum, d) => sum + d, 0)
  )

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <motion.svg
        key={signature}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="h-44 w-44 shrink-0 drop-shadow-sm"
        viewBox="0 0 150 150"
        role="img"
        aria-label={`Breakdown chart, ${centerLabel} total`}
      >
        <circle
          cx={75}
          cy={75}
          r={radius}
          fill="none"
          stroke="#102B52"
          strokeOpacity={0.08}
          strokeWidth={16}
        />
        <circle
          cx={75}
          cy={75}
          r={48}
          fill="none"
          stroke="#102B52"
          strokeOpacity={0.05}
          strokeWidth={1}
        />
        {segments.map((segment, index) => {
          const dash = dashes[index]
          const current = offsets[index]
          return (
            <motion.circle
              key={segment.label}
              cx={75}
              cy={75}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={16}
              strokeLinecap="round"
              strokeOpacity={segment.opacity ?? 1}
              strokeDashoffset={-current}
              initial={{
                strokeDasharray: `0 ${circumference}`,
                opacity: 0,
              }}
              animate={{
                strokeDasharray: `${dash} ${circumference - dash}`,
                opacity: 1,
              }}
              transition={{
                duration: 0.8,
                delay: 0.1 + index * 0.09,
                ease: EASE_OUT,
              }}
              transform="rotate(-90 75 75)"
            />
          )
        })}
        <motion.text
          key={`label-${centerLabel}`}
          x={75}
          y={75}
          textAnchor="middle"
          dominantBaseline="central"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="fill-navy text-xl font-bold"
        >
          {centerLabel}
        </motion.text>
      </motion.svg>
      <motion.div
        key={`legend-${signature}`}
        variants={stagger(0.05, 0.18)}
        initial="hidden"
        animate="show"
        className="grid w-full flex-1 grid-cols-1 gap-1 text-sm sm:text-base"
      >
        {segments.map((segment) => (
          <motion.div
            key={segment.label}
            variants={staggerItem}
            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-cream/70"
          >
            <span
              className="inline-block size-2.5 rounded-full ring-2 ring-white"
              style={{ backgroundColor: segment.color }}
            />
            <span className="truncate text-deep/75">{segment.label}</span>
            <strong className="min-w-8 text-right tabular-nums">
              {segment.value}
            </strong>
            <strong className="min-w-10 rounded-full bg-cream px-2 py-0.5 text-right text-xs text-deep/70 tabular-nums">
              {total ? Math.round((segment.value / total) * 100) : 0}%
            </strong>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
