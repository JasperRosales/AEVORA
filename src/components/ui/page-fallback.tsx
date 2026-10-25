import { Skeleton } from "@/components/ui/skeleton"

/**
 * Suspense fallback for lazily loaded screens. Instead of a spinner it draws
 * the page's component skeleton — greeting card, KPI tiles and two content
 * cards — so the layout does not jump when the real screen arrives.
 */
export function PageFallback() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Loading page…</span>

      {/* Greeting / page header card */}
      <div className="neu flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="w-full max-w-md space-y-2.5">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="neu flex items-center gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Content cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="neu p-4">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-3.5">
              {Array.from({ length: 5 }, (_, row) => (
                <div key={row} className="flex items-center gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <Skeleton className="h-3 flex-1" />
                  <Skeleton className="h-3 w-14 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
