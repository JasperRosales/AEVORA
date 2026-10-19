import { motion } from "motion/react"
import { staggerItem } from "@/lib/motion"

/** Presentational primitives shared across the client portal tabs. */

export function Card({
  title,
  children,
}: {
  title?: string
  children: React.ReactNode
}) {
  return (
    <motion.section
      variants={staggerItem}
      className="rounded-2xl bg-white p-4 shadow-[0_4px_14px_rgba(12,44,85,0.07)]"
    >
      {title && (
        <h2 className="mb-2 text-xs font-semibold tracking-wide text-deep/60 uppercase">
          {title}
        </h2>
      )}
      {children}
    </motion.section>
  )
}

export function Spinner() {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-2 py-10 text-center text-sm text-deep/50"
    >
      Loading
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
    </motion.p>
  )
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
    </motion.p>
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
