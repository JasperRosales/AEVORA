/** Presentational primitives shared across the client portal tabs. */

export function Card({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(12,44,85,0.07)]">
      {title && (
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-deep/60 uppercase">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}

export function Spinner() {
  return <p className="py-10 text-center text-sm text-deep/50">Loading...</p>
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>
  )
}

export function pesos(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
