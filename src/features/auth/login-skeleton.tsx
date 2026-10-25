import { Skeleton } from "@/components/ui/skeleton"

/**
 * Shadcn-style skeleton of the shared login shell, shown only while an
 * existing session is being restored. Refreshing /login or /client/login
 * therefore stays on the login layout instead of replaying the splash; the
 * splash is reserved for a successful sign-in.
 */
export function LoginSkeleton() {
  return (
    <div
      className="flex min-h-svh items-center justify-center bg-navy p-6"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Checking your session…</span>

      <div className="w-full max-w-sm">
        {/* Brand lockup */}
        <div className="mb-6 flex items-center gap-3 px-1 [&_[data-slot=skeleton]]:bg-cream/15">
          <Skeleton className="size-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2.5 w-40 max-w-full" />
          </div>
        </div>

        {/* Login card */}
        <div className="rounded-2xl bg-cream p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          <Skeleton className="mb-2 h-5 w-24" />
          <Skeleton className="mb-6 h-3 w-56 max-w-full" />

          <Skeleton className="mb-1.5 h-2.5 w-12" />
          <Skeleton className="mb-3.5 h-9 w-full rounded-lg" />

          <Skeleton className="mb-1.5 h-2.5 w-16" />
          <Skeleton className="mb-6 h-9 w-full rounded-lg" />

          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
