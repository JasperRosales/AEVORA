import { CalendarCheck, CreditCard, FileSignature, Users } from "lucide-react"
import { useState } from "react"
import { usePagination } from "@/lib/use-pagination"
import { Card } from "@/components/ui/card"
import { DonutChart } from "@/components/ui/donut-chart"
import { KpiTile } from "@/components/ui/kpi-tile"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  agreements,
  cemeteries,
  clients,
  generatedReports,
  payments,
  plots,
  reservations,
} from "@/data/mock"
import { formatCurrency } from "@/lib/format"

function groupRevenue(
  list: typeof payments,
  mode: "week" | "month" | "year",
) {
  const map = new Map<string, number>()
  for (const p of list) {
    if (p.status !== "Paid") continue
    const d = new Date(p.date)
    let sortKey = d.getTime()
    let label = ""
    if (mode === "year") {
      sortKey = new Date(d.getFullYear(), 0, 1).getTime()
      label = String(d.getFullYear())
    } else if (mode === "month") {
      sortKey = new Date(d.getFullYear(), d.getMonth(), 1).getTime()
      label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    } else {
      const weekStart = new Date(d)
      weekStart.setDate(d.getDate() - d.getDay())
      sortKey = weekStart.getTime()
      label = weekStart.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    }
    const k = `${sortKey}|${label}`
    map.set(k, (map.get(k) ?? 0) + p.amount)
  }
  return [...map.entries()]
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([k, amount]) => ({ label: k.split("|")[1], amount }))
}

function BarChart({
  data,
  formatValue,
}: {
  data: { label: string; value: number; color: string }[]
  formatValue?: (value: number) => string
}) {
  const width = 520
  const height = 180
  const pad = 30
  const max = Math.max(...data.map((d) => d.value), 1)
  const n = data.length || 1
  const slot = (width - pad * 2) / n
  const bw = slot * 0.55
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad}
          x2={width - pad}
          y1={height - pad - t * (height - pad * 2)}
          y2={height - pad - t * (height - pad * 2)}
          stroke="#061633"
          strokeOpacity="0.08"
        />
      ))}
      {data.map((d, i) => {
        const x = pad + i * slot + (slot - bw) / 2
        const h = (d.value / max) * (height - pad * 2)
        const y = height - pad - h
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={bw} height={h} rx={4} fill={d.color} />
            <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="#061633">
              {formatValue ? formatValue(d.value) : d.value}
            </text>
            <text x={x + bw / 2} y={height - 10} textAnchor="middle" fontSize="10" fill="#4F7894">
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
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
  const height = 180
  const pad = 30
  const max = Math.max(...data.map((d) => d.amount), 1)
  const points = data.map((d, i) => ({
    x: pad + (data.length === 1 ? (width - pad * 2) / 2 : (i / (data.length - 1)) * (width - pad * 2)),
    y: height - pad - (d.amount / max) * (height - pad * 2),
    ...d,
  }))
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ")
  const area = `${line} L${points[points.length - 1].x},${height - pad} L${points[0].x},${height - pad} Z`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="areaMonthly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4F7894" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#4F7894" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={pad}
          x2={width - pad}
          y1={height - pad - t * (height - pad * 2)}
          y2={height - pad - t * (height - pad * 2)}
          stroke="#061633"
          strokeOpacity="0.08"
        />
      ))}
      <path d={area} fill="url(#areaMonthly)" />
      <path
        d={line}
        fill="none"
        stroke="#4F7894"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#061633" />
          <text
            x={p.x}
            y={p.y - 8}
            textAnchor="middle"
            fontSize="10"
            fontWeight="600"
            fill="#061633"
          >
            {formatValue ? formatValue(p.amount) : p.amount}
          </text>
          <text x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#4F7894">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function ReportsPage() {
  const { page, pageCount, current: reportRows, setPage } = usePagination(
    generatedReports,
    8,
  )

  const [cemetery, setCemetery] = useState("All Cemeteries")
  const [month, setMonth] = useState("All Months")
  const [appliedCemetery, setAppliedCemetery] = useState("All Cemeteries")
  const [appliedMonth, setAppliedMonth] = useState("All Months")

  const monthOptions = [...new Set(payments.map((p) => p.date.slice(0, 7)))].sort()
  const filteredPayments = payments.filter(
    (p) =>
      (appliedCemetery === "All Cemeteries" || p.cemeteryId === appliedCemetery) &&
      (appliedMonth === "All Months" || p.date.startsWith(appliedMonth)),
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
  const plotCounts = {
    Available: filteredPlots.filter((p) => p.status === "Available").length,
    Reserved: filteredPlots.filter((p) => p.status === "Reserved").length,
    Occupied: filteredPlots.filter((p) => p.status === "Occupied").length,
    Waiting: filteredPlots.filter((p) => p.status === "Waiting for Checking").length,
  }
  const occupancyRate = Math.round(
    ((plotCounts.Occupied + plotCounts.Reserved) / (filteredPlots.length || 1)) * 100,
  )

  const reservationStatus = (
    ["Pending", "Under Verification", "Confirmed", "Cancelled"] as const
  ).map((s) => ({
    status: s,
    count: filteredReservations.filter((r) => r.status === s).length,
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(
          [
            { label: "Total Clients", value: clients.length, icon: Users, trend: { up: true, text: "5%" } },
            { label: "Total Reservations", value: reservations.length, icon: CalendarCheck, trend: { up: false, text: "6%" } },
            { label: "Total Payments", value: payments.length, icon: CreditCard, trend: { up: true, text: "2%" } },
            { label: "Total Agreements", value: agreements.length, icon: FileSignature, trend: { up: false, text: "3%" } },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile key={label} label={label} value={value} icon={icon} trend={trend} />
        ))}
      </div>

      <Card title="Filters">
        <div className="flex flex-wrap items-center gap-3">
          <select
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
          <select
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
            onClick={() => {
              setAppliedMonth(month)
              setAppliedCemetery(cemetery)
            }}
            className="neu-button px-4 py-1.5 text-sm"
          >
            Generate
          </button>
          <button
            onClick={() => {
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
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {(
          [
            { title: "Monthly Revenue", data: revenueByPeriod.Monthly, type: "area" },
            { title: "Weekly Revenue", data: revenueByPeriod.Weekly, type: "bar" },
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Plot Status Breakdown">
          <DonutChart
            centerLabel={`${occupancyRate}%`}
            segments={[
              { label: "Available", value: plotCounts.Available, color: "#16a34a" },
              { label: "Reserved", value: plotCounts.Reserved, color: "#2563eb" },
              { label: "Occupied", value: plotCounts.Occupied, color: "#dc2626" },
              { label: "Waiting", value: plotCounts.Waiting, color: "#eab308" },
            ]}
          />
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
      </div>

      <Card title="Recent Reports">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Report Name</th>
              <th>Type</th>
              <th>Date Generated</th>
              <th>Generated By</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reportRows.map((r) => (
              <tr key={r.id} className="border-t border-deep/10">
                <td className="py-1.5">{r.name}</td>
                <td>{r.type}</td>
                <td>{r.dateGenerated}</td>
                <td>{r.generatedBy}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>
                  <button className="neu-button px-2.5 py-1 text-[11px]">Edit</button>{" "}
                  <button className="neu-button px-2.5 py-1 text-[11px]">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <Pagination
          page={page}
          pageCount={pageCount}
          onChange={setPage}
        />
      </Card>
    </div>
  )
}
