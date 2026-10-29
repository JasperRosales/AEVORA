import { CalendarCheck, CreditCard, FileSignature, Users } from "lucide-react"
import { useState } from "react"
import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { KpiTile } from "@/components/ui/kpi-tile"
import { insertReport, useData } from "@/data/store"
import { formatCurrency } from "@/lib/format"
import { EASE_OUT, fadeUp, stagger } from "@/lib/motion"
import { createReport } from "@/lib/neon-api"
import { ReportPreviewModal } from "@/features/overview/overview-report-preview"
import { PlotOccupancySummary } from "@/features/overview/overview-occupancy"
import type { Payment, Plot } from "@/types/domain"
import type { Report } from "@/features/overview/overview-reports"

function groupRevenue(list: Payment[], mode: "week" | "month" | "year") {
  const map = new Map<string, number>()
  for (const p of list) {
    if (p.status !== "Paid") continue
    const d = new Date(p.date)
    const [sortKey, label] =
      mode === "year"
        ? [new Date(d.getFullYear(), 0, 1).getTime(), String(d.getFullYear())]
        : mode === "month"
          ? [
              new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
              d.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              }),
            ]
          : (() => {
              const weekStart = new Date(d)
              weekStart.setDate(d.getDate() - d.getDay())
              return [
                weekStart.getTime(),
                weekStart.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }),
              ]
            })()

    const k = `${sortKey}|${label}`
    map.set(k, (map.get(k) ?? 0) + p.amount)
  }
  return [...map.entries()]
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([k, amount]) => ({ label: k.split("|")[1], amount }))
}

function buildFilteredPaymentsReport(
  payments: Payment[],
  cemeteryLabel: string,
  monthLabel: string
): Report {
  const paid = payments
    .filter((payment) => payment.status === "Paid")
    .reduce((sum, payment) => sum + payment.amount, 0)
  const pending = payments
    .filter((payment) => payment.status !== "Paid")
    .reduce((sum, payment) => sum + payment.amount, 0)
  const statusCounts = ["Paid", "Pending", "Overdue"].map((status) => ({
    label: status,
    value: String(
      payments.filter((payment) => payment.status === status).length
    ),
  }))

  return {
    type: "Payments",
    summary: [
      { label: "Transactions", value: String(payments.length) },
      {
        label: "Paid Transactions",
        value: String(
          payments.filter((payment) => payment.status === "Paid").length
        ),
      },
      { label: "Collected", value: formatCurrency(paid) },
      { label: "Outstanding", value: formatCurrency(pending) },
      { label: "Cemetery", value: cemeteryLabel },
      { label: "Month", value: monthLabel },
    ],
    breakdown: statusCounts,
    table: {
      columns: [
        "Receipt",
        "Client",
        "Plot",
        "Date",
        "Status",
        "Method",
        "Amount",
      ],
      rows: payments.map((payment) => [
        payment.receiptNumber,
        payment.clientName,
        payment.plotNumber,
        payment.date,
        payment.status,
        payment.method,
        formatCurrency(payment.amount),
      ]),
    },
  }
}

const PLOT_STATUSES = [
  { label: "Available", color: "#16a34a" },
  { label: "Reserved", color: "#2563eb" },
  { label: "Occupied", color: "#dc2626" },
  { label: "Waiting for Checking", color: "#eab308" },
  { label: "Unavailable", color: "#64748b" },
] as const

function buildPlotAvailabilityReport(
  plots: Plot[],
  cemeteries: { id: string; name: string }[],
  cemeteryId: string
): Report {
  const rows = cemeteries
    .filter(
      (cemetery) =>
        cemeteryId === "All Cemeteries" || cemetery.id === cemeteryId
    )
    .map((cemetery) => {
      const cemeteryPlots = plots.filter(
        (plot) => plot.cemeteryId === cemetery.id
      )
      const counts = Object.fromEntries(
        PLOT_STATUSES.map(({ label }) => [
          label,
          cemeteryPlots.filter((plot) => plot.status === label).length,
        ])
      ) as Record<(typeof PLOT_STATUSES)[number]["label"], number>
      const occupied = counts.Occupied + counts.Reserved
      return {
        cemetery,
        plots: cemeteryPlots,
        counts,
        occupancy: Math.round((occupied / (cemeteryPlots.length || 1)) * 100),
        availability: Math.round(
          (counts.Available / (cemeteryPlots.length || 1)) * 100
        ),
      }
    })
  const scopedPlots = rows.flatMap((row) => row.plots)
  const totalAvailable = scopedPlots.filter(
    (plot) => plot.status === "Available"
  ).length
  const totalReserved = scopedPlots.filter(
    (plot) => plot.status === "Reserved"
  ).length
  const totalOccupied = scopedPlots.filter(
    (plot) => plot.status === "Occupied"
  ).length
  const totalOccupancy = Math.round(
    ((totalOccupied + totalReserved) / (scopedPlots.length || 1)) * 100
  )

  return {
    type: "Plot Occupancy",
    summary: [
      { label: "Cemeteries", value: String(rows.length) },
      { label: "Total plots", value: String(scopedPlots.length) },
      { label: "Available", value: String(totalAvailable) },
      { label: "Reserved", value: String(totalReserved) },
      { label: "Occupied", value: String(totalOccupied) },
      { label: "Occupancy rate", value: `${totalOccupancy}%` },
    ],
    breakdown: PLOT_STATUSES.map(({ label }) => ({
      label,
      value: `${scopedPlots.filter((plot) => plot.status === label).length} · ${Math.round((scopedPlots.filter((plot) => plot.status === label).length / (scopedPlots.length || 1)) * 100)}%`,
    })),
    table: {
      columns: [
        "Cemetery",
        "Total plots",
        "Available",
        "Reserved",
        "Occupied",
        "Waiting",
        "Unavailable",
        "Availability",
        "Occupancy",
      ],
      rows: rows.map((row) => [
        row.cemetery.name,
        row.plots.length,
        row.counts.Available,
        row.counts.Reserved,
        row.counts.Occupied,
        row.counts["Waiting for Checking"],
        row.counts.Unavailable,
        `${row.availability}%`,
        `${row.occupancy}%`,
      ]),
    },
  }
}

function CemeteryPlotAnalytics({
  cemeteries,
  plots,
}: {
  cemeteries: { id: string; name: string }[]
  plots: Plot[]
}) {
  const data = cemeteries.map((cemetery) => {
    const cemeteryPlots = plots.filter(
      (plot) => plot.cemeteryId === cemetery.id
    )
    const counts = PLOT_STATUSES.map(({ label }) => ({
      label,
      count: cemeteryPlots.filter((plot) => plot.status === label).length,
    }))
    const occupied =
      counts.find((item) => item.label === "Occupied")!.count +
      counts.find((item) => item.label === "Reserved")!.count
    return {
      name: cemetery.name,
      total: cemeteryPlots.length,
      counts,
      occupancy: Math.round((occupied / (cemeteryPlots.length || 1)) * 100),
      availability: Math.round(
        ((counts.find((item) => item.label === "Available")?.count ?? 0) /
          (cemeteryPlots.length || 1)) *
          100
      ),
    }
  })

  return (
    <>
      <Card title="Plot Availability by Cemetery">
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.name}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-deep">
                  {item.name}
                </span>
                <span className="shrink-0 text-deep/60">
                  {item.total} plots · {item.availability}% available
                </span>
              </div>
              <div
                className="flex h-3 overflow-hidden rounded-full bg-navy/10"
                role="img"
                aria-label={`${item.name}: ${item.counts.map((status) => `${status.label} ${status.count}`).join(", ")}`}
              >
                {item.counts.map((status) => {
                  const color = PLOT_STATUSES.find(
                    (entry) => entry.label === status.label
                  )!.color
                  return status.count > 0 && item.total > 0 ? (
                    <span
                      key={status.label}
                      title={`${status.label}: ${status.count}`}
                      style={{
                        backgroundColor: color,
                        width: `${(status.count / item.total) * 100}%`,
                      }}
                    />
                  ) : null
                })}
              </div>
            </div>
          ))}
          {data.length === 0 && <ChartEmpty />}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2 border-t border-deep/10 pt-3">
          {PLOT_STATUSES.map((status) => (
            <span
              key={status.label}
              className="flex items-center gap-1.5 text-[10px] text-deep/70"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              {status.label}
            </span>
          ))}
        </div>
      </Card>

      <Card title="Occupancy Rate by Cemetery">
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.name}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-medium text-deep">
                  {item.name}
                </span>
                <span className="shrink-0 font-semibold text-deep/70 tabular-nums">
                  {item.occupancy}% · {item.total} plots
                </span>
              </div>
              <div
                className="h-3 overflow-hidden rounded-full bg-navy/10"
                role="img"
                aria-label={`${item.name}: ${item.occupancy}% occupied or reserved`}
              >
                <motion.div
                  className="h-full rounded-full bg-teal"
                  initial={{ width: 0 }}
                  animate={{ width: `${item.occupancy}%` }}
                  transition={{ duration: 0.65, ease: EASE_OUT }}
                />
              </div>
            </div>
          ))}
          {data.length === 0 && <ChartEmpty />}
        </div>
        <p className="mt-4 border-t border-deep/10 pt-3 text-[10px] text-deep/60">
          Occupancy includes reserved and occupied plots.
        </p>
      </Card>
    </>
  )
}

/** Shown when a chart has no rows yet (e.g. before data loads). */
function ChartEmpty() {
  return (
    <p className="py-16 text-center text-xs text-deep/50">
      No data to display yet.
    </p>
  )
}

function chartLabel(value: number, formatValue?: (value: number) => string) {
  if (!formatValue) return String(Math.round(value))
  const formatted = formatValue(value)
  if (!formatted.startsWith("₱")) return formatted
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}m`
  if (value >= 10_000) return `₱${Math.round(value / 1_000)}k`
  if (value >= 1_000) return `₱${(value / 1_000).toFixed(1)}k`
  return formatted
}

function BarChart({
  data,
  formatValue,
}: {
  data: { label: string; value: number; color: string }[]
  formatValue?: (value: number) => string
}) {
  const width = 520
  const height = 220
  const pad = { top: 20, right: 18, bottom: 42, left: 58 }
  if (data.length === 0) return <ChartEmpty />
  const max = Math.max(...data.map((d) => d.value), 1)
  const n = data.length || 1
  const chartWidth = width - pad.left - pad.right
  const chartHeight = height - pad.top - pad.bottom
  const slot = chartWidth / n
  const bw = slot * 0.55
  const signature = data.map((d) => `${d.label}:${d.value}`).join("|")
  return (
    <motion.svg
      key={signature}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full overflow-visible"
      role="img"
      aria-label="Bar chart"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = pad.top + chartHeight * (1 - t)
        return (
          <g key={t}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke="#061633"
              strokeOpacity={t === 0 ? 0.2 : 0.08}
              strokeDasharray={t === 0 ? undefined : "3 5"}
            />
            <text
              x={pad.left - 8}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill="#4F7894"
            >
              {chartLabel(max * t, formatValue)}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const x = pad.left + i * slot + (slot - bw) / 2
        const h = (d.value / max) * chartHeight
        const y = pad.top + chartHeight - h
        return (
          <g key={d.label}>
            <motion.rect
              x={x}
              width={bw}
              rx={Math.min(7, bw / 2)}
              fill={d.color}
              initial={{ y: pad.top + chartHeight, height: 0 }}
              animate={{ y, height: h }}
              style={{ filter: "drop-shadow(0 3px 4px rgba(6,22,51,0.12))" }}
              transition={{
                duration: 0.55,
                delay: 0.05 + i * 0.05,
                ease: EASE_OUT,
              }}
            />
            <motion.text
              x={x + bw / 2}
              y={Math.max(pad.top + 10, y - 7)}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="#061633"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
            >
              {chartLabel(d.value, formatValue)}
            </motion.text>
            <text
              x={x + bw / 2}
              y={height - 13}
              textAnchor="middle"
              fontSize="9"
              fill="#4F7894"
            >
              {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
            </text>
          </g>
        )
      })}
    </motion.svg>
  )
}

function AreaChart({
  data,
  formatValue,
}: {
  data: { label: string; amount: number }[]
  formatValue?: (value: number) => string
}) {
  const width = 520
  const height = 220
  const pad = { top: 24, right: 20, bottom: 42, left: 58 }
  if (data.length === 0) return <ChartEmpty />
  const max = Math.max(...data.map((d) => d.amount), 1)
  const chartWidth = width - pad.left - pad.right
  const chartHeight = height - pad.top - pad.bottom
  const points = data.map((d, i) => ({
    x:
      pad.left +
      (data.length === 1
        ? chartWidth / 2
        : (i / (data.length - 1)) * chartWidth),
    y: pad.top + chartHeight - (d.amount / max) * chartHeight,
    ...d,
  }))
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ")
  const area = `${line} L${points[points.length - 1].x},${pad.top + chartHeight} L${points[0].x},${pad.top + chartHeight} Z`
  const signature = points.map((p) => `${p.label}:${p.amount}`).join("|")
  return (
    <motion.svg
      key={signature}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full overflow-visible"
      role="img"
      aria-label="Revenue trend chart"
    >
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = pad.top + chartHeight * (1 - t)
        return (
          <g key={t}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              stroke="#061633"
              strokeOpacity={t === 0 ? 0.2 : 0.08}
              strokeDasharray={t === 0 ? undefined : "3 5"}
            />
            <text
              x={pad.left - 8}
              y={y + 3}
              textAnchor="end"
              fontSize="9"
              fill="#4F7894"
            >
              {chartLabel(max * t, formatValue)}
            </text>
          </g>
        )
      })}
      <motion.path
        d={area}
        fill="#4F7894"
        fillOpacity="0.12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="#4F7894"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 2px 3px rgba(6,22,51,0.14))" }}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
      />
      {points.map((p, i) => (
        <g key={p.label}>
          <motion.circle
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#fff"
            stroke="#102B52"
            strokeWidth="2.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
            transition={{ duration: 0.3, delay: 0.45 + i * 0.05 }}
          />
          <motion.text
            x={p.x}
            y={Math.max(pad.top + 10, p.y - 9)}
            textAnchor="middle"
            fontSize="9"
            fontWeight="600"
            fill="#061633"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
          >
            {chartLabel(p.amount, formatValue)}
          </motion.text>
          <text
            x={p.x}
            y={height - 13}
            textAnchor="middle"
            fontSize="9"
            fill="#4F7894"
          >
            {p.label}
          </text>
        </g>
      ))}
    </motion.svg>
  )
}

export function ReportsPage() {
  const { agreements, cemeteries, clients, payments, plots, reservations } =
    useData()

  const [reportKind, setReportKind] = useState<"Payments" | "Plot Occupancy">(
    "Payments"
  )
  const [cemetery, setCemetery] = useState("All Cemeteries")
  const [month, setMonth] = useState("All Months")
  const [appliedCemetery, setAppliedCemetery] = useState("All Cemeteries")
  const [appliedMonth, setAppliedMonth] = useState("All Months")
  const [preview, setPreview] = useState<Report | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  const monthOptions = [
    ...new Set(payments.map((p) => p.date.slice(0, 7))),
  ].sort()
  const filteredPayments = payments.filter(
    (p) =>
      (appliedCemetery === "All Cemeteries" ||
        p.cemeteryId === appliedCemetery) &&
      (appliedMonth === "All Months" || p.date.startsWith(appliedMonth))
  )
  const revenueByPeriod = {
    Weekly: groupRevenue(filteredPayments, "week"),
    Monthly: groupRevenue(filteredPayments, "month"),
  }
  const filteredPlots =
    appliedCemetery === "All Cemeteries"
      ? plots
      : plots.filter((p) => p.cemeteryId === appliedCemetery)
  const filteredReservations =
    appliedCemetery === "All Cemeteries"
      ? reservations
      : reservations.filter((r) => r.cemeteryId === appliedCemetery)
  const reservationStatus = (
    ["Pending", "Under Verification", "Confirmed", "Cancelled"] as const
  ).map((s) => ({
    status: s,
    count: filteredReservations.filter((r) => r.status === s).length,
  }))

  async function generateReport() {
    setAppliedMonth(month)
    setAppliedCemetery(cemetery)
    setGenerationError(null)

    const cemeteryLabel =
      cemetery === "All Cemeteries"
        ? cemetery
        : (cemeteries.find((item) => item.id === cemetery)?.name ?? cemetery)
    const monthLabel =
      month === "All Months"
        ? month
        : new Date(`${month}-01`).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
    const report =
      reportKind === "Plot Occupancy"
        ? buildPlotAvailabilityReport(plots, cemeteries, cemetery)
        : buildFilteredPaymentsReport(
            payments.filter(
              (payment) =>
                (cemetery === "All Cemeteries" ||
                  payment.cemeteryId === cemetery) &&
                (month === "All Months" || payment.date.startsWith(month))
            ),
            cemeteryLabel,
            monthLabel
          )
    setPreview(report)
    setGenerating(true)

    try {
      insertReport(
        await createReport({
          type: report.type,
          name: `${report.type} Report${cemetery !== "All Cemeteries" ? ` - ${cemeteryLabel}` : " - All Cemeteries"}${reportKind === "Payments" && month !== "All Months" ? ` - ${monthLabel}` : ""}`,
        })
      )
    } catch (error) {
      setGenerationError(
        `Preview ready, but the report could not be logged: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    } finally {
      setGenerating(false)
    }
  }

  return (
    <motion.div
      variants={stagger(0.08, 0.03)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div
        variants={stagger(0.06, 0.05)}
        className="grid grid-cols-2 gap-3 md:grid-cols-4"
      >
        {(
          [
            {
              label: "Total Clients",
              value: clients.length,
              icon: Users,
              trend: { up: true, text: "5%" },
            },
            {
              label: "Total Reservations",
              value: reservations.length,
              icon: CalendarCheck,
              trend: { up: false, text: "6%" },
            },
            {
              label: "Total Payments",
              value: payments.length,
              icon: CreditCard,
              trend: { up: true, text: "2%" },
            },
            {
              label: "Total Agreements",
              value: agreements.length,
              icon: FileSignature,
              trend: { up: false, text: "3%" },
            },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile
            key={label}
            label={label}
            value={value}
            icon={icon}
            trend={trend}
          />
        ))}
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card title="Generate Report">
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Report type"
              value={reportKind}
              onChange={(e) =>
                setReportKind(e.target.value as "Payments" | "Plot Occupancy")
              }
              className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
            >
              <option value="Payments">Payments</option>
              <option value="Plot Occupancy">
                Plot Occupancy & Availability
              </option>
            </select>
            {reportKind === "Payments" && (
              <select
                aria-label="Payment report month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
              >
                <option value="All Months">All Months</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    {new Date(`${m}-01`).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </option>
                ))}
              </select>
            )}
            <select
              aria-label="Cemetery scope"
              value={cemetery}
              onChange={(e) => setCemetery(e.target.value)}
              className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
            >
              <option value="All Cemeteries">All Cemeteries</option>
              {cemeteries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => void generateReport()}
              disabled={generating}
              className="neu-button px-4 py-1.5 text-sm disabled:opacity-60"
            >
              {generating ? "Generating..." : "Generate"}
            </button>
            <button
              onClick={() => {
                setReportKind("Payments")
                setMonth("All Months")
                setCemetery("All Cemeteries")
                setAppliedMonth("All Months")
                setAppliedCemetery("All Cemeteries")
              }}
              className="neu-button px-4 py-1.5 text-sm"
            >
              Clear Filters
            </button>
          </div>
          {generationError && (
            <p className="mt-2 text-xs text-red-600" role="status">
              {generationError}
            </p>
          )}
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-2">
        {(
          [
            {
              title: "Monthly Revenue",
              data: revenueByPeriod.Monthly,
              type: "area",
            },
            {
              title: "Weekly Revenue",
              data: revenueByPeriod.Weekly,
              type: "bar",
            },
          ] as const
        ).map(({ title, data, type }) => {
          const total = data.reduce((sum, d) => sum + d.amount, 0)
          const last = data[data.length - 1]
          const prev = data[data.length - 2]
          const change =
            last && prev && prev.amount > 0
              ? Math.round(((last.amount - prev.amount) / prev.amount) * 100)
              : null
          return (
            <Card key={title} title={title}>
              <p className="mb-3 text-xs text-deep">
                Total:{" "}
                <strong className="text-sm text-navy">
                  {formatCurrency(total)}
                </strong>
                {change !== null && (
                  <span
                    className={`ml-2 font-semibold ${change >= 0 ? "text-teal" : "text-red-600"}`}
                  >
                    {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%{" "}
                    {last && prev ? `(${prev.label} → ${last.label})` : ""}
                  </span>
                )}
              </p>
              {type === "area" ? (
                <AreaChart data={data} formatValue={formatCurrency} />
              ) : (
                <BarChart
                  data={data.map((r) => ({
                    label: r.label,
                    value: r.amount,
                    color: "#4F7894",
                  }))}
                  formatValue={formatCurrency}
                />
              )}
            </Card>
          )
        })}
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 md:grid-cols-2">
        <Card title="Plot Status Breakdown">
          <PlotOccupancySummary plots={filteredPlots} />
        </Card>

        <Card title="Reservations by Status">
          <BarChart
            data={reservationStatus.map(({ status, count }, i) => ({
              label: status,
              value: count,
              color: ["#eab308", "#4F7894", "#16a34a", "#dc2626"][i],
            }))}
          />
        </Card>
      </motion.div>

      <motion.div variants={fadeUp} className="grid gap-4 xl:grid-cols-2">
        <CemeteryPlotAnalytics cemeteries={cemeteries} plots={plots} />
      </motion.div>

      {preview && (
        <ReportPreviewModal report={preview} onClose={() => setPreview(null)} />
      )}
    </motion.div>
  )
}
