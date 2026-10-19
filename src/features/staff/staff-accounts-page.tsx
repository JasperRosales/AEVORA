import { ArrowLeft, RefreshCw, Trash2, UserPlus, Users } from "lucide-react"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { useSession } from "@/data/session"
import { EASE_OUT, fadeUp, rowItem, rowList, stagger } from "@/lib/motion"
import {
  createStaff,
  deleteStaff,
  fetchStaff,
  type StaffUser,
} from "@/lib/neon-api"

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
      const created = await createStaff({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      })
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
    <motion.div
      variants={stagger(0.08, 0.03)}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-4xl space-y-4"
    >
      <motion.div variants={fadeUp} className="flex items-center gap-3">
        <motion.button
          onClick={onBack}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
          className="neu-button px-3 py-1.5 text-sm"
        >
          <ArrowLeft size={13} className="mr-1 inline" /> Back
        </motion.button>
        <div>
          <h1 className="text-lg font-semibold">Staff Accounts</h1>
          <p className="text-xs text-deep/60">
            Signed in as {user?.email} · role: {user?.role}
          </p>
        </div>
        <motion.button
          onClick={reload}
          whileTap={{ scale: 0.97 }}
          className="neu-button ml-auto px-3 py-1.5 text-sm"
        >
          <RefreshCw size={13} className="mr-1 inline" /> Refresh
        </motion.button>
      </motion.div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="overflow-hidden rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </motion.p>
        )}
        {notice && (
          <motion.p
            key="notice"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT }}
            className="overflow-hidden rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800"
          >
            {notice}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp}>
        <Card title="Create Account">
          <form onSubmit={onCreate} className="flex flex-wrap items-end gap-3">
            <div className="min-w-44 flex-1">
              <label className="mb-1 block text-xs font-medium text-deep">
                Full name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Staff Ana"
                className="w-full rounded-lg border border-deep/30 bg-cream px-3 py-1.5 text-sm"
              />
            </div>
            <div className="min-w-44 flex-1">
              <label className="mb-1 block text-xs font-medium text-deep">
                Email
              </label>
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
              <label className="mb-1 block text-xs font-medium text-deep">
                Password
              </label>
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
              <label className="mb-1 block text-xs font-medium text-deep">
                Role
              </label>
              <select
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "staff" | "admin" | "client")
                }
                className="rounded-lg border border-deep/30 bg-cream px-2 py-1.5 text-sm"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
              </select>
            </div>
            <motion.button
              type="submit"
              disabled={busy}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-deep disabled:opacity-60"
            >
              <UserPlus size={13} className="mr-1 inline" />{" "}
              {busy ? "Creating..." : "Create"}
            </motion.button>
          </form>
        </Card>
      </motion.div>

      <motion.div variants={fadeUp}>
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
              <motion.tbody
                key={users.length}
                variants={rowList}
                initial="hidden"
                animate="show"
              >
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
                  <motion.tr
                    key={u.id}
                    variants={rowItem}
                    className="border-t border-deep/10"
                  >
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
                        <motion.button
                          onClick={() => onDelete(u)}
                          disabled={busy}
                          whileTap={{ scale: 0.95 }}
                          className="neu-button px-2.5 py-1 text-[11px]"
                        >
                          <Trash2 size={11} className="mr-0.5 inline" /> Delete
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  )
}
