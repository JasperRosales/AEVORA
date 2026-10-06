import { statusBadgeClass } from "@/lib/status"

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${statusBadgeClass(status)}`}
    >
      {status}
    </span>
  )
}
