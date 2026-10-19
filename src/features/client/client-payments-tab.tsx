import { StatusBadge } from "@/components/ui/status-badge"
import { useClientData } from "@/data/client-store"
import { Card, ErrorNote, pesos, Spinner } from "./client-ui"

/** Payment history tab. */
export function PaymentsTab() {
  const { status, payments, error } = useClientData()

  if (status === "loading" || status === "idle") return <Spinner />
  if (status === "error") return <ErrorNote message={error ?? "Something went wrong."} />

  if (payments.length === 0) {
    return (
      <Card>
        <p className="text-sm text-deep/70">No payments on record yet.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {payments.map((p, i) => (
        <Card key={`${p.receipt_number}-${i}`}>
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold">{p.receipt_number}</p>
            <StatusBadge status={p.status} />
          </div>
          <p className="mt-1 text-lg font-bold text-navy">{pesos(p.amount)}</p>
          <p className="text-sm">
            {p.type} · Plot {p.plot_number}
          </p>
          <p className="text-xs text-deep/60">
            {p.cemetery} · {p.method} · {p.date}
          </p>
        </Card>
      ))}
    </div>
  )
}
