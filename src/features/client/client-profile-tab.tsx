import { signOut, useSession } from "@/data/session"
import { useClientData } from "@/data/client-store"
import { Card } from "./client-ui"

/** Profile tab: account identity, linked cemetery record, sign out. */
export function ProfileTab() {
  const { user } = useSession()
  const { status, summary } = useClientData()
  const client = summary?.client

  const initials = (user?.name ?? "?")
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-lg font-bold text-cream">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold">{user?.name}</p>
            <p className="truncate text-xs text-deep/60">{user?.email}</p>
            <span className="mt-1 inline-block rounded-full bg-teal/20 px-2 py-0.5 text-[10px] font-semibold text-deep">
              client
            </span>
          </div>
        </div>
      </Card>

      {status === "ready" && client && (
        <Card title="Account details">
          <dl className="space-y-2 text-sm">
            <Detail label="Client ID" value={client.clientId} />
            <Detail label="Contact" value={client.contactNumber} />
            <Detail label="Type" value={client.type} />
            <Detail label="Registered" value={client.registeredAt} />
            <Detail label="Status" value={client.status} />
          </dl>
        </Card>
      )}

      <button
        onClick={() => void signOut()}
        className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition active:bg-red-100"
      >
        Sign Out
      </button>

      <p className="pb-2 text-center text-[11px] text-deep/40">
        Aevora Cemetery Management System
      </p>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-deep/60">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  )
}
