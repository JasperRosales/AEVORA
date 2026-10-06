import { cemeteries } from "@/data/mock"

export function CemeterySelector({
  value,
  onChange,
  includeAll = true,
}: {
  value: string
  onChange: (value: string) => void
  includeAll?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm outline-none focus:border-teal"
    >
      {includeAll && <option value="all">All Cemeteries</option>}
      {cemeteries.map((cemetery) => (
        <option key={cemetery.id} value={cemetery.id}>
          {cemetery.name}
        </option>
      ))}
    </select>
  )
}

export function cemeteryName(id: string): string {
  if (id === "all") return "All Cemeteries"
  return cemeteries.find((c) => c.id === id)?.name ?? id
}
