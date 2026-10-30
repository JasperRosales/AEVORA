import { useEffect, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion } from "motion/react"
import { X } from "lucide-react"
import { EASE_OUT } from "@/lib/motion"

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal dialog rendered into a portal.
 *
 * Closes on Escape or backdrop click, keeps Tab focus inside the panel, locks
 * body scroll while open, and returns focus to the trigger on close. Panel
 * content unmounts when closed, so per-modal filter state resets each time.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  panelClassName,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  panelClassName?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  // Scroll lock + focus management (only runs when the dialog opens/closes).
  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const frame = requestAnimationFrame(() => panelRef.current?.focus())

    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open])

  // Escape to close and a simple Tab focus trap.
  useEffect(() => {
    if (!open) return

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== "Tab") return

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <motion.div
            aria-hidden="true"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-navy/60 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.985 }}
            transition={{ duration: 0.26, ease: EASE_OUT }}
            className={`relative flex max-h-[92svh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-cream shadow-[0_24px_80px_rgba(6,22,51,0.4)] outline-none sm:max-h-[85svh] ${panelClassName ?? ""}`}
          >
            <header className="flex shrink-0 items-start gap-3 border-b border-deep/10 px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="text-lg font-semibold">
                  {title}
                </h2>
                {description && (
                  <p className="text-xs text-deep/60">{description}</p>
                )}
              </div>
              <motion.button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                className="rounded-full p-2 text-deep/70 transition-colors hover:bg-navy/10 hover:text-navy"
              >
                <X size={18} />
              </motion.button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {children}
            </div>

            {footer && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-deep/10 px-5 py-3 text-xs text-deep/70">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
