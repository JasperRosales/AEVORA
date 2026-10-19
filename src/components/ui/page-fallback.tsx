/**
 * Shown while a lazily-loaded screen is being fetched (see src/features/lazy-routes.ts).
 *
 * `fullScreen` is for top-level routes that own the whole viewport (the client
 * portal and the hidden staff page); the default fits the dashboard content area.
 */
export function PageFallback({ fullScreen = false }: { fullScreen?: boolean }) {
  if (fullScreen) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-navy">
        <p className="text-sm text-cream/60">Loading Aevora...</p>
      </div>
    )
  }
  return <p className="py-24 text-center text-sm text-deep/50">Loading Aevora...</p>
}
