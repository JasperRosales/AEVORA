import {
  Banknote,
  CalendarCheck,
  CalendarPlus,
  CheckCircle,
  Clock,
  ClipboardCheck,
  CreditCard,
  FileSignature,
  FileText,
  Home,
  LayoutGrid,
  Map,
  PieChart,
  Users,
  UserPlus,
} from "lucide-react"
import { useMemo, useState } from "react"
import { CemeterySelector, cemeteryName } from "@/components/cemetery-selector"
import { Card } from "@/components/ui/card"
import { DonutChart } from "@/components/ui/donut-chart"
import { KpiTile } from "@/components/ui/kpi-tile"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  activities,
  agreements,
  notifications,
  payments,
  plots,
  reservations,
} from "@/data/mock"
import { countByStatus, formatCurrency } from "@/lib/format"

const quickActions = [
  { label: "Add Client", icon: UserPlus, desc: "Register a new client record" },
  { label: "Add Plot", icon: LayoutGrid, desc: "Add a new plot to the cemetery" },
  { label: "View Cemetery Map", icon: Map, desc: "Open the intteractive cemetery map" },
  { label: "Create Reservation", icon: CalendarPlus, desc: "Start a new plot reservation" },
  {
    label: "Review Information Checking",
    icon: ClipboardCheck,
    desc: "Verify pending client submissions",
  },
  { label: "View Agreements", icon: FileSignature, desc: "Browse all agreement records" },
  { label: "Record Payment", icon: Banknote, desc: "Log a new payment transaction" },
  { label: "Generate Report", icon: FileText, desc: "Create and export a report" },
]

const reportShortcuts = [
  { label: "Plot Occupancy", icon: PieChart },
  { label: "Reservations", icon: CalendarCheck },
  { label: "Clients", icon: Users },
  { label: "Payments", icon: CreditCard },
  { label: "Agreements", icon: FileSignature },
  { label: "Information Checking", icon: ClipboardCheck },
]

export function OverviewPage() {
  const [cemeteryId, setCemeteryId] = useState("all")

  const filteredPlots = useMemo(
    () =>
      cemeteryId === "all"
        ? plots
        : plots.filter((p) => p.cemeteryId === cemeteryId),
    [cemeteryId],
  )
  const counts = countByStatus(filteredPlots)

  const occupancy = filteredPlots.length
    ? Math.round(((counts["Occupied"] ?? 0) / filteredPlots.length) * 100) +
      Math.round(((counts["Reserved"] ?? 0) / filteredPlots.length) * 100)
    : 0

  const totalCollected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0)
  const remaining = payments
    .filter((p) => p.status !== "Paid")
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingChecks = reservations.filter(
    (r) => r.verification !== "Verified",
  )

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Good morning, Admin Kyle</h2>
            <p className="text-sm text-deep">
              Here is the current status of {cemeteryName(cemeteryId)}. All
              systems are operational.
            </p>
            <p className="text-xs text-deep/70">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <CemeterySelector value={cemeteryId} onChange={setCemeteryId} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {(
          [
            { label: "Total Plots", value: filteredPlots.length, icon: LayoutGrid, trend: { up: false, text: "6%" } },
            { label: "Available", value: counts["Available"] ?? 0, icon: CheckCircle, trend: { up: true, text: "2%" } },
            { label: "Reserved", value: counts["Reserved"] ?? 0, icon: CalendarCheck, trend: { up: true, text: "3%" } },
            { label: "Occupied", value: counts["Occupied"] ?? 0, icon: Home, trend: { up: false, text: "4%" } },
            { label: "Waiting for Checking", value: counts["Waiting for Checking"] ?? 0, icon: Clock, trend: { up: true, text: "5%" } },
          ] as const
        ).map(({ label, value, icon, trend }) => (
          <KpiTile key={label} label={label} value={value} icon={icon} trend={trend} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Plot Occupancy Overview">
          <DonutChart
            centerLabel={`${occupancy}%`}
            segments={[
              {
                label: "Available",
                value: counts["Available"] ?? 0,
                color: "#16a34a",
              },
              {
                label: "Reserved",
                value: counts["Reserved"] ?? 0,
                color: "#2563eb",
              },
              {
                label: "Occupied",
                value: counts["Occupied"] ?? 0,
                color: "#dc2626",
              },
              {
                label: "Waiting",
                value: counts["Waiting for Checking"] ?? 0,
                color: "#eab308",
                opacity: 1,
              },
            ]}
          />
          <div className="mt-3 border-t border-deep/15 pt-3">
            <p className="text-sm">
              <strong className="text-lg">{filteredPlots.length}</strong>{" "}
              total plots
            </p>
            <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-navy/10">
              <span
                className="bg-teal"
                style={{ width: `${occupancy}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-deep">
              Occupancy rate {occupancy}%
            </p>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="grid grid-cols-4 gap-3">
            {quickActions.map(({ label, icon: Icon, desc }) => (
              <div key={label} className="group relative">
                <button
                  aria-label={label}
                  className="neu-button flex aspect-square w-full flex-col items-center justify-center gap-2 p-2"
                >
                  <Icon
                    size={20}
                    className="text-deep transition-transform duration-200 group-hover:scale-110"
                  />
                  <span className="text-center text-[11px] leading-tight font-medium">
                    {label}
                  </span>
                </button>
                <span className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 rounded-md bg-navy px-2 py-1 text-[11px] whitespace-nowrap text-cream opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {desc}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent Reservations">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-deep uppercase">
                <th>No.</th>
                <th>Client</th>
                <th>Cemetery</th>
                <th>Plot</th>
                <th>Date</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reservations.slice(0, 5).map((r) => (
                <tr key={r.id} className="border-t border-deep/10">
                  <td className="py-1.5">{r.reservationNumber}</td>
                  <td>{r.clientName}</td>
                  <td>{cemeteryName(r.cemeteryId)}</td>
                  <td>{r.plotNumber}</td>
                  <td>{r.date}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <button className="neu-button px-2.5 py-1 text-[11px]">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>

        <Card title="Information Checking">
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-deep uppercase">
                <th>Client</th>
                <th>Reference</th>
                <th>Submitted</th>
                <th>Verification</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {pendingChecks.map((r) => (
                <tr key={r.id} className="border-t border-deep/10">
                  <td className="py-1.5">{r.clientName}</td>
                  <td>{r.reservationNumber}</td>
                  <td>{r.date}</td>
                  <td>
                    <StatusBadge status={r.verification} />
                  </td>
                  <td>
                    <button className="neu-button px-2.5 py-1 text-[11px]">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Payment Summary">
          <div className="space-y-3">
            <div className="neu-sm p-3">
              <p className="text-[11px] text-deep uppercase">
                Amount Collected
              </p>
              <p className="text-xl font-bold">
                {formatCurrency(totalCollected)}
              </p>
              <p className="text-[11px] text-deep">
                of {payments.length} transactions
              </p>
            </div>
            <div>
              <div className="flex h-2.5 overflow-hidden rounded-full">
                <span
                  className="bg-teal"
                  style={{
                    width: `${(payments.filter((p) => p.status === "Paid").length / payments.length) * 100}%`,
                  }}
                />
                <span
                  className="bg-deep/60"
                  style={{
                    width: `${(payments.filter((p) => p.status === "Pending").length / payments.length) * 100}%`,
                  }}
                />
                <span
                  className="bg-navy"
                  style={{
                    width: `${(payments.filter((p) => p.status === "Overdue").length / payments.length) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-2 grid grid-cols-3 text-center text-[11px]">
                <p>
                  <span className="font-bold text-teal">
                    {payments.filter((p) => p.status === "Paid").length}
                  </span>{" "}
                  Paid
                </p>
                <p>
                  <span className="font-bold text-deep">
                    {payments.filter((p) => p.status === "Pending").length}
                  </span>{" "}
                  Pending
                </p>
                <p>
                  <span className="font-bold text-navy">
                    {payments.filter((p) => p.status === "Overdue").length}
                  </span>{" "}
                  Overdue
                </p>
              </div>
            </div>
            <div className="flex justify-between neu-sm px-3 py-2 text-sm">
              <span className="text-deep">Remaining Balance</span>
              <span className="font-bold">{formatCurrency(remaining)}</span>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button className="neu-button px-3 py-1.5 text-xs">
              View All Payments
            </button>
          </div>
        </Card>

        <Card title="Agreement Summary">
          <div className="space-y-3">
            <div className="neu-sm p-3">
              <p className="text-[11px] text-deep uppercase">Total Agreements</p>
              <p className="text-xl font-bold">{agreements.length}</p>
               <p className="text-xs text-deep">
                {agreements.filter((a) => a.status === "Active").length} out of{" "}
                {agreements.length} agreements are active.
              </p>
            </div>
            <div>
              <div className="flex h-2.5 overflow-hidden rounded-full">
                <span
                  className="bg-deep/60"
                  style={{
                    width: `${(agreements.filter((a) => a.status === "Pending").length / agreements.length) * 100}%`,
                  }}
                />
                <span
                  className="bg-teal"
                  style={{
                    width: `${(agreements.filter((a) => a.status === "Active").length / agreements.length) * 100}%`,
                  }}
                />
                <span
                  className="bg-navy"
                  style={{
                    width: `${(agreements.filter((a) => a.status === "Completed").length / agreements.length) * 100}%`,
                  }}
                />
                <span
                  className="bg-navy/20"
                  style={{
                    width: `${(agreements.filter((a) => a.status === "Cancelled").length / agreements.length) * 100}%`,
                  }}
                />
              </div>
              <div className="mt-2 grid grid-cols-4 text-center text-[11px]">
                <p>
                  <span className="font-bold text-deep">
                    {agreements.filter((a) => a.status === "Pending").length}
                  </span>{" "}
                  Pending
                </p>
                <p>
                  <span className="font-bold text-teal">
                    {agreements.filter((a) => a.status === "Active").length}
                  </span>{" "}
                  Active
                </p>
                <p>
                  <span className="font-bold text-navy">
                    {agreements.filter((a) => a.status === "Completed").length}
                  </span>{" "}
                  Completed
                </p>
                <p>
                  <span className="font-bold text-navy/50">
                    {agreements.filter((a) => a.status === "Cancelled").length}
                  </span>{" "}
                  Cancelled
                </p>
              </div>
             
            </div>
            <div className="flex justify-between neu-sm px-3 py-2 text-sm">
              <span className="text-deep">Completed Agreements</span>
              <span className="font-bold">
                {agreements.filter((a) => a.status === "Completed").length}
              </span>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button className="neu-button px-3 py-1.5 text-xs">
              View All Agreements
            </button>
          </div>
        </Card>

        <Card title="System Notifications">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-deep uppercase">
                  <th>Notification</th>
                  <th>Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td>{n.message}</td>
                    <td>{n.dateTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recent Activity">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-deep uppercase">
                  <th>Activity</th>
                  <th>User</th>
                  <th>Date &amp; Time</th>
                  <th>Related Record</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id}>
                    <td>{a.action}</td>
                    <td>{a.user}</td>
                    <td>{a.dateTime}</td>
                    <td>{a.record}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Reports and Analytics">
          <div className="grid grid-cols-3 grid-rows-2 gap-3">
            {reportShortcuts.map(({ label, icon: Icon }) => (
              <button
                key={label}
                className="neu-button flex aspect-square flex-col items-center justify-center gap-2 p-2"
              >
                <Icon size={20} className="text-deep" />
                <span className="text-center text-[11px] leading-tight font-medium">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
