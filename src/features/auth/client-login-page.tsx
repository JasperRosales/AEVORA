import { Lock, Mail, Phone, User } from "lucide-react"
import { useState, type FormEvent } from "react"
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

export function ClientLoginPage({ notice }: { notice: string | null }) {
  const form = useSignInForm(notice, "client")
  const [mode, setMode] = useState<"signin" | "register">("signin")
  const [regFullName, setRegFullName] = useState("")
  const [regContact, setRegContact] = useState("")
  const [regEmail, setRegEmail] = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regError, setRegError] = useState<string | null>(null)
  const [regOk, setRegOk] = useState<string | null>(null)
  const [regBusy, setRegBusy] = useState(false)

  async function onRegister(event: FormEvent) {
    event.preventDefault()
    setRegBusy(true)
    setRegError(null)
    setRegOk(null)
    try {
      const BASE = import.meta.env.VITE_NEON_API_URL as string | undefined
      const url = BASE ? `${BASE}/register/client` : "/api/register/client"
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          contactNumber: regContact.trim(),
          email: regEmail.trim(),
          password: regPassword,
        }),
      })
      const json = (await res.json().catch(() => ({}))) as {
        error?: string
        clientId?: string
      }
      if (!res.ok) throw new Error(json.error ?? "Registration failed")
      setRegOk(
        `Account created (${json.clientId ?? "Client"}). You can sign in now.`
      )
      form.setEmail(regEmail.trim())
      setRegPassword("")
      setMode("signin")
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed")
    } finally {
      setRegBusy(false)
    }
  }

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
        className="pointer-events-none absolute -bottom-48 -right-32 h-96 w-96 rounded-full bg-cream/5 blur-3xl"
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
            <motion.p variants={fadeUp} custom={1} className="text-xs text-cream/50">
              Cemetery System — Client Portal
            </motion.p>
          </motion.div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="show"
          className="rounded-2xl bg-cream p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25, ease: EASE_OUT }}
            className="mb-5 flex rounded-lg bg-white/60 p-1"
          >
            <motion.button
              type="button"
              onClick={() => {
                setMode("signin")
                setRegError(null)
                setRegOk(null)
              }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "signin" ? "text-cream" : "text-deep hover:text-navy"
              }`}
            >
              {mode === "signin" && (
                <motion.span
                  layoutId="client-tab"
                  className="absolute inset-0 rounded-md bg-navy"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Sign In</span>
            </motion.button>
            <motion.button
              type="button"
              onClick={() => {
                setMode("register")
                form.setEmail("")
                form.setPassword("")
                setRegError(null)
              }}
              whileTap={{ scale: 0.97 }}
              className={`relative flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === "register" ? "text-cream" : "text-deep hover:text-navy"
              }`}
            >
              {mode === "register" && (
                <motion.span
                  layoutId="client-tab"
                  className="absolute inset-0 rounded-md bg-navy"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-10">Register</span>
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait" initial={false}>
            {mode === "signin" ? (
              <motion.form
                key="signin"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                onSubmit={form.onSubmit}
                className="space-y-3"
              >
                <div>
                  <h1 className="mb-1 text-lg font-semibold">Sign in</h1>
                  <p className="mb-4 text-xs text-deep/60">
                    Use your family account to view reservations, payments and documents.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-deep">
                    Email
                  </label>
                  <div className="relative">
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
                      placeholder="family@email.com"
                      className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-3 pl-9 text-sm outline-none transition-all focus:border-teal focus:ring-2 focus:ring-teal/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-deep">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="password"
                      required
                      autoComplete="current-password"
                      value={form.password}
                      onChange={(e) => form.setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-3 pl-9 text-sm outline-none transition-all focus:border-teal focus:ring-2 focus:ring-teal/30"
                    />
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {form.error && (
                    <motion.p
                      key="error"
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
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
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-cream transition-all hover:bg-deep disabled:opacity-60"
                >
                  {form.busy ? "Signing in..." : "Sign In"}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="register"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: EASE_OUT }}
                onSubmit={onRegister}
                className="space-y-3"
              >
                <div>
                  <h1 className="mb-1 text-lg font-semibold">Create account</h1>
                  <p className="mb-4 text-xs text-deep/60">
                    Register to access your family's records in the client portal.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-deep">
                    Full name
                  </label>
                  <div className="relative">
                    <User
                      size={14}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Maria Santos"
                      className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-3 pl-9 text-sm outline-none transition-all focus:border-teal focus:ring-2 focus:ring-teal/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-deep">
                    Contact number
                  </label>
                  <div className="relative">
                    <Phone
                      size={14}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      required
                      value={regContact}
                      onChange={(e) => setRegContact(e.target.value)}
                      placeholder="0917-555-0101"
                      className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-3 pl-9 text-sm outline-none transition-all focus:border-teal focus:ring-2 focus:ring-teal/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-deep">
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={14}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="email"
                      required
                      autoComplete="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="family@email.com"
                      className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-3 pl-9 text-sm outline-none transition-all focus:border-teal focus:ring-2 focus:ring-teal/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-deep">
                    Password (min. 8 characters)
                  </label>
                  <div className="relative">
                    <Lock
                      size={14}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50"
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-deep/30 bg-white py-2 pr-3 pl-9 text-sm outline-none transition-all focus:border-teal focus:ring-2 focus:ring-teal/30"
                    />
                  </div>
                </div>
                <AnimatePresence initial={false}>
                  {regError && (
                    <motion.p
                      key="reg-error"
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="overflow-hidden rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                      {regError}
                    </motion.p>
                  )}
                  {regOk && (
                    <motion.p
                      key="reg-ok"
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.25, ease: EASE_OUT }}
                      className="overflow-hidden rounded-lg bg-teal/10 px-3 py-2 text-xs text-deep"
                    >
                      {regOk}
                    </motion.p>
                  )}
                </AnimatePresence>
                <motion.button
                  type="submit"
                  disabled={regBusy}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-cream transition-all hover:bg-deep disabled:opacity-60"
                >
                  {regBusy ? "Creating account..." : "Register"}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" animate="show" className="mt-4 space-y-1 px-1">
          <motion.p variants={fadeUp} custom={0} className="text-[11px] text-cream/40">
            Staff and admin accounts sign in at /login.
          </motion.p>
          <motion.p variants={fadeUp} custom={1} className="text-[11px] text-cream/40">
            Batangas State University — The National Engineering University
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  )
}
