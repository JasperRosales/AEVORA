import type { ReactNode } from "react"

export function Card({
  title,
  children,
  action,
}: {
  title?: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="neu p-4">
      {title && (
        <header className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            {title}
          </h2>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}
