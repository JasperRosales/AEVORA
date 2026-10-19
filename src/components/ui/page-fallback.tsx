import { motion } from "motion/react"

/**
 * Shown while a lazily-loaded screen is being fetched (see src/features/lazy-routes.ts).
 *
 * `fullScreen` is for top-level routes that own the whole viewport (the client
 * portal and the hidden staff page); the default fits the dashboard content area.
 */
export function PageFallback({ fullScreen = false }: { fullScreen?: boolean }) {
  const label = (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center gap-2"
    >
      Loading Aevora
      <span className="flex gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1 rounded-full bg-current"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15,
            }}
          />
        ))}
      </span>
    </motion.span>
  )

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex min-h-svh items-center justify-center bg-navy"
      >
        <p className="text-sm text-cream/60">{label}</p>
      </motion.div>
    )
  }
  return <p className="py-24 text-center text-sm text-deep/50">{label}</p>
}
