import { AnimatePresence, motion } from "motion/react"
import { EASE_OUT } from "@/lib/motion"

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number
  pageCount: number
  onChange: (page: number) => void
}) {
  if (pageCount <= 1) return null

  const pages: (number | "...")[] = []
  if (pageCount <= 7) {
    for (let i = 1; i <= pageCount; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push("...")
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(pageCount - 1, page + 1);
      i++
    )
      pages.push(i)
    if (page < pageCount - 2) pages.push("...")
    pages.push(pageCount)
  }

  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <p className="flex items-center gap-1 text-xs text-deep">
        Page
        <span className="relative inline-flex h-4 min-w-4 justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={page}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              {page}
            </motion.span>
          </AnimatePresence>
        </span>
        of {pageCount}
      </p>
      <div className="flex items-center gap-1">
        <motion.button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          whileTap={{ scale: 0.95 }}
          className="neu-button px-3 py-1 text-xs disabled:opacity-40"
        >
          Prev
        </motion.button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-1 text-xs text-deep/60">
              ...
            </span>
          ) : (
            <motion.button
              key={p}
              onClick={() => onChange(p)}
              whileTap={{ scale: 0.95 }}
              className="neu-button px-3 py-1 text-xs"
              style={
                p === page
                  ? {
                      background:
                        "color-mix(in srgb, var(--color-teal) 45%, var(--color-cream))",
                    }
                  : undefined
              }
            >
              {p}
            </motion.button>
          )
        )}
        <motion.button
          onClick={() => onChange(Math.min(pageCount, page + 1))}
          disabled={page === pageCount}
          whileTap={{ scale: 0.95 }}
          className="neu-button px-3 py-1 text-xs disabled:opacity-40"
        >
          Next
        </motion.button>
      </div>
    </div>
  )
}
