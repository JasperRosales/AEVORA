import { Lock, Mail } from "lucide-react"
import { useState, type FormEvent } from "react"
import { signIn } from "@/data/session"

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
    <div className="flex min-h-svh items-center justify-center bg-navy p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3 px-1">
          <img src="/aevora-icon.ico" alt="Aevora logo" className="h-11 w-11 rounded-xl" />
          <div>
            <p className="text-xl font-bold tracking-wide text-cream">Aevora</p>
            <p className="text-xs text-cream/50">Cemetery System — Admin Portal</p>
          </div>
        </div>
        <form
          onSubmit={onSubmit}
          className="rounded-2xl bg-cream p-6 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        >
          <h1 className="mb-1 text-lg font-semibold">Sign in</h1>
          <p className="mb-5 text-xs text-deep/60">
            Use your staff or admin account to continue.
          </p>

          <label className="mb-1 block text-xs font-medium text-deep">Email</label>
          <div className="relative mb-3">
            <Mail size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50" />
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

          <label className="mb-1 block text-xs font-medium text-deep">Password</label>
          <div className="relative mb-4">
            <Lock size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-deep/50" />
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

          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-navy py-2.5 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
          >
            {busy ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="mt-4 px-1 text-[11px] text-cream/40">
          Batangas State University — The National Engineering University
        </p>
      </div>
    </div>
  )
}
