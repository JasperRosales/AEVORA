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
  const radius = 60
  const circumference = 2 * Math.PI * radius
  // Re-key the chart when the data changes so the arcs redraw on filter change.
  const signature = segments.map((s) => `${s.label}:${s.value}`).join("|")
  // Precompute each arc's length and start offset without mutating during render.
  const dashes = segments.map((s) => (s.value / total) * circumference)
  const offsets = dashes.map((_, i) =>
    dashes.slice(0, i).reduce((sum, d) => sum + d, 0)
  )

  return (
    <div className="flex items-center gap-6">
      <motion.svg
        key={signature}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="h-52 w-52 shrink-0"
        viewBox="0 0 150 150"
      >
        <circle
          cx={75}
          cy={75}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={18}
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
              strokeWidth={18}
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
          className="fill-navy text-lg font-bold"
        >
          {centerLabel}
        </motion.text>
      </motion.svg>
      <motion.div
        key={`legend-${signature}`}
        variants={stagger(0.05, 0.18)}
        initial="hidden"
        animate="show"
        className="flex-1 text-base"
      >
        {segments.map((segment) => (
          <motion.div
            key={segment.label}
            variants={staggerItem}
            className="grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-3 py-1"
          >
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: segment.color }}
            />
            <span>{segment.label}:</span>
            <strong className="text-center">{segment.value}</strong>
            <strong className="text-right">
              {total ? Math.round((segment.value / total) * 100) : 0}%
            </strong>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
