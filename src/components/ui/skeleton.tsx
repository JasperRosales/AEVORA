import type { ComponentProps } from "react"

/**
 * Shadcn-style skeleton: a pulsing placeholder block. Compose with width and
 * height utilities (`<Skeleton className="h-4 w-32" />`) to mirror the real
 * content while it loads.
 */
export function Skeleton({ className = "", ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={`animate-pulse rounded-md bg-navy/10 ${className}`}
      {...props}
    />
  )
}
