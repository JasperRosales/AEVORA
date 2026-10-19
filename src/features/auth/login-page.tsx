import { Lock, Mail } from "lucide-react"
import { useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { signIn } from "@/data/session"
import { EASE_OUT } from "@/lib/motion"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: EASE_OUT }}
      className="flex min-h-svh items-center justify-center bg-navy p-6"
    >
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="mb-6 flex items-center gap-3 px-1"
        >
          <motion.img
            src="/aevora-icon.ico"
            alt="Aevora logo"
            initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1,
            }}
            className="h-11 w-11 rounded-xl"
          />
          <div>
            <p className="text-xl font-bold tracking-wide text-cream">Aevora</p>
            <p className="text-xs text-cream/50">
              Cemetery System — Admin Portal
            </p>
          </div>
        </motion.div>
        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT }}
          className="rounded-2xl bg-cream p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2, ease: EASE_OUT }}
            className="mb-1 text-lg font-semibold"
          >
            Sign in
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.24, ease: EASE_OUT }}
            className="mb-5 text-xs text-deep/60"
          >
            Use your staff or admin account to continue.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.28, ease: EASE_OUT }}
          >
            <label className="mb-1 block text-xs font-medium text-deep">
              Email
            </label>
            <div className="relative mb-3">
              <Mail
                size={14}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
              />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aevora.local"
                className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.34, ease: EASE_OUT }}
          >
            <label className="mb-1 block text-xs font-medium text-deep">
              Password
            </label>
            <div className="relative mb-4">
              <Lock
                size={14}
                className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
              />
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="overflow-hidden rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={busy}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4, ease: EASE_OUT }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign In"}
          </motion.button>
        </motion.form>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.55 }}
          className="mt-4 px-1 text-[11px] text-cream/40"
        >
          Batangas State University — The National Engineering University
        </motion.p>
      </div>
    </motion.div>
  )
}
