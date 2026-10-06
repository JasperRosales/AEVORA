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
  let offset = 0

  return (
    <div className="flex items-center gap-6">
      <svg className="h-52 w-52 shrink-0" viewBox="0 0 150 150">
        <circle
          cx={75}
          cy={75}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={18}
        />
        {segments.map((segment) => {
          const fraction = segment.value / total
          const dash = fraction * circumference
          const current = offset
          offset += dash
          return (
            <circle
              key={segment.label}
              cx={75}
              cy={75}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={18}
              strokeOpacity={segment.opacity ?? 1}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-current}
              transform="rotate(-90 75 75)"
            />
          )
        })}
        <text
          x={75}
          y={75}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-navy text-lg font-bold"
        >
          {centerLabel}
        </text>
      </svg>
      <div className="flex-1 text-base">
        {segments.map((segment) => (
          <div
            key={segment.label}
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
          </div>
        ))}
      </div>
    </div>
  )
}
