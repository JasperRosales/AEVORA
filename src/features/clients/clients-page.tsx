import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/ui/status-badge"
import { clients } from "@/data/mock"
import { usePagination } from "@/lib/use-pagination"
import type { Client } from "@/types/domain"

export function ClientsPage() {
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("All")
  const [selected, setSelected] = useState<Client | null>(null)

  const filtered = useMemo(
    () =>
      clients.filter(
        (c) =>
          (c.fullName.toLowerCase().includes(query.toLowerCase()) ||
            c.clientId.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase())) &&
          (typeFilter === "All" || c.type === typeFilter),
      ),
    [query, typeFilter],
  )
  const { page, pageCount, current: rows, setPage } = usePagination(filtered, 8)

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <Card title="Client Records">
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ID, or email..."
            className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
          >
            <option value="All">All Types</option>
            <option value="Individual">Individual</option>
            <option value="Corporate">Corporate</option>
          </select>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-deep uppercase">
              <th>Client ID</th>
              <th>Full Name</th>
              <th>Contact</th>
              <th>Email</th>
              <th>Type</th>
              <th>Registered</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                className="cursor-pointer border-t border-deep/10"
                onClick={() => setSelected(c)}
              >
                <td className="py-1.5">{c.clientId}</td>
                <td>{c.fullName}</td>
                <td>{c.contactNumber}</td>
                <td>{c.email}</td>
                <td>{c.type}</td>
                <td>{c.registeredAt}</td>
                <td>
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </Card>

      <Card title="Client Profile">
        {selected ? (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Name</dt>
              <dd className="font-semibold">{selected.fullName}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Client ID</dt>
              <dd>{selected.clientId}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Contact</dt>
              <dd>{selected.contactNumber}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Email</dt>
              <dd>{selected.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Type</dt>
              <dd>{selected.type}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Registered</dt>
              <dd>{selected.registeredAt}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Status</dt>
              <dd>
                <StatusBadge status={selected.status} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt>Reservations</dt>
              <dd>{selected.reservations}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-deep/70">
            Select a client to view their profile.
          </p>
        )}
      </Card>
    </div>
  )
}
