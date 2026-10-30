import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { useState } from "react"
import { AnimatePresence, motion, type Variants } from "motion/react"
import { EASE_OUT } from "@/lib/motion"
import { useSignInForm } from "./sign-in-form"

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.4,
      ease: EASE_OUT,
    },
  }),
}

const stagger: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.98, y: 18 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
    },
  },
}

const float: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

/**
 * Admin/staff login — the navy dashboard aesthetic: logo lockup above a cream
 * card, compact desktop-oriented fields. Lives at `/login`; the client
 * portal's own screen is a separate component at `/client/login`
 * (see App.tsx for the routing).
 */
export function AdminLoginPage({ notice }: { notice: string | null }) {
  const form = useSignInForm(notice, "admin")
  const [showPassword, setShowPassword] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT }}
      className="relative flex min-h-svh items-center justify-center overflow-hidden bg-navy p-6"
    >
      <motion.div
        variants={float}
        animate="animate"
        className="pointer-events-none absolute -top-40 -left-40 h-80 w-80 rounded-full bg-teal/10 blur-3xl"
      />
      <motion.div
        variants={float}
        animate="animate"
        transition={{ delay: 1.5 }}
        className="pointer-events-none absolute -right-32 -bottom-48 h-96 w-96 rounded-full bg-cream/5 blur-3xl"
      />
      <motion.div
        variants={float}
        animate="animate"
        transition={{ delay: 3 }}
        className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full bg-teal/5 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="mb-6 flex items-center gap-3 px-1"
        >
          <motion.img
            src="/aevora-icon.ico"
            alt="Aevora logo"
            initial={{ opacity: 0, scale: 0.8, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 18,
              delay: 0.15,
            }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="h-11 w-11 rounded-xl shadow-lg shadow-black/20"
          />
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="text-xl font-bold tracking-wide text-cream"
            >
              Aevora
            </motion.p>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="text-xs text-cream/50"
            >
              Cemetery System — Admin Portal
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.form
          onSubmit={form.onSubmit}
          variants={scaleIn}
          initial="hidden"
          animate="show"
          className="rounded-2xl bg-cream p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.h1
              variants={fadeUp}
              custom={0}
              className="mb-1 text-lg font-semibold"
            >
              Sign in
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={1}
              className="mb-5 text-xs text-deep/60"
            >
              Use your staff or admin account to continue.
            </motion.p>

            <motion.div variants={fadeUp} custom={2}>
              <label className="mb-1 block text-xs font-medium text-deep">
                Email
              </label>
              <div className="relative mb-3">
                <Mail
                  size={14}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
                />
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => form.setEmail(e.target.value)}
                  placeholder="admin@aevora.local"
                  className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-3 pl-9 text-sm transition-all outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
                />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} custom={3}>
              <label className="mb-1 block text-xs font-medium text-deep">
                Password
              </label>
              <div className="relative mb-4">
                <Lock
                  size={14}
                  className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
                />
                <motion.input
                  whileFocus={{ scale: 1.01 }}
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => form.setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-10 pl-9 text-sm transition-all outline-none focus:border-teal focus:ring-2 focus:ring-teal/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-deep/50 transition-colors hover:text-navy"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <AnimatePresence initial={false}>
              {form.error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="overflow-hidden rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  {form.error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={form.busy}
              variants={fadeUp}
              custom={4}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-cream transition-all hover:bg-deep disabled:opacity-60"
            >
              {form.busy ? "Signing in..." : "Sign In"}
            </motion.button>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  )
}
