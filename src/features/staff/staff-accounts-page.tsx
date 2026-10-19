import { ArrowLeft, RefreshCw, Trash2, UserPlus, Users } from "lucide-react"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { Card } from "@/components/ui/card"
import { useSession } from "@/data/session"
import { createStaff, deleteStaff, fetchStaff, type StaffUser } from "@/lib/neon-api"

/**
 * Staff account management. Hidden — not in the sidebar; reachable only at
 * #/staff-accounts and only for users whose Neon Auth role is "admin"
 * (enforced here and, server-side, by the adminGuard on the API function).
 */
export function StaffAccountsPage({ onBack }: { onBack: () => void }) {
  const { user } = useSession()
  const [users, setUsers] = useState<StaffUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"staff" | "admin" | "client">("staff")

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchStaff()
      .then(setUsers)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  async function onCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const created = await createStaff({ name: name.trim(), email: email.trim(), password, role })
      setNotice(`Account created for ${created.name} (${created.email})`)
      setName("")
      setEmail("")
      setPassword("")
      setRole("staff")
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(target: StaffUser) {
    if (!window.confirm(`Delete account ${target.email}?`)) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await deleteStaff(target.id)
      setNotice(`Deleted ${target.email}`)
      reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="neu-button px-3 py-1.5 text-sm">
          <ArrowLeft size={13} className="mr-1 inline" /> Back
        </button>
        <div>
          <h1 className="text-lg font-semibold">Staff Accounts</h1>
          <p className="text-xs text-deep/60">
            Signed in as {user?.email} · role: {user?.role}
          </p>
        </div>
        <button onClick={reload} className="neu-button ml-auto px-3 py-1.5 text-sm">
          <RefreshCw size={13} className="mr-1 inline" /> Refresh
        </button>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {notice && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>
      )}

      <Card title="Create Account">
        <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
          <div className="min-w-44 flex-1">
            <label className="mb-1 block text-xs font-medium text-deep">Full name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Staff Ana"
              className="w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
            />
          </div>
          <div className="min-w-44 flex-1">
            <label className="mb-1 block text-xs font-medium text-deep">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@aevora.local"
              className="w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
            />
          </div>
          <div className="min-w-40 flex-1">
            <label className="mb-1 block text-xs font-medium text-deep">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 characters"
              className="w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-deep">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "staff" | "admin" | "client")}
              className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
              <option value="client">Client</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
          >
            <UserPlus size={13} className="mr-1 inline" /> {busy ? "Creating..." : "Create"}
          </button>
        </form>
      </Card>

      <Card title={`Accounts (${users.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-deep uppercase">
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-3 text-deep/60">
                    Loading accounts...
                  </td>
                </tr>
              )}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-3 text-deep/60">
                    No accounts found.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-t border-deep/10">
                  <td className="py-1.5">
                    <Users size={13} className="mr-1.5 inline text-deep/50" />
                    {u.name}
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={
                        u.role === "admin"
                          ? "rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy"
                          : u.role === "client"
                            ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                            : "rounded-full bg-teal/20 px-2 py-0.5 text-xs font-medium text-deep"
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="text-right">
                    {u.id !== user?.id && (
                      <button
                        onClick={() => onDelete(u)}
                        disabled={busy}
                        className="neu-button px-2.5 py-1 text-[11px]"
                      >
                        <Trash2 size={11} className="mr-0.5 inline" /> Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
