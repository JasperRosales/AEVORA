import { Hono } from "hono"
import { adminGuard, authBaseUrl, authGuard, type AppEnv } from "../lib/auth"
import { pool } from "../lib/db"

/** Who am I + admin-only account management (staff, admin and client users). */
const routes = new Hono<AppEnv>()

routes.get("/me", authGuard, (c) => c.json(c.get("caller")))

routes.get("/staff", adminGuard, async (c) => {
  const { rows } = await pool.query(
    'select id, email, name, role, "createdAt" from neon_auth."user" order by "createdAt"',
  )
  return c.json(rows)
})

/**
 * Creates an account on Managed Auth by calling the branch's public sign-up
 * route server-to-server, then promoting the new user's role in the
 * neon_auth schema.
 */
routes.post("/staff", adminGuard, async (c) => {
  const body = await c.req.json<{
    name?: string
    email?: string
    password?: string
    role?: string
  }>()
  const { name, email, password } = body
  const role = body.role === "admin" || body.role === "client" ? body.role : "staff"
  if (!email || !password || !name) {
    return c.json({ error: "name, email and password are required" }, 400)
  }
  if (password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400)
  }
  if (!authBaseUrl) return c.json({ error: "Neon Auth is not enabled" }, 500)

  const res = await fetch(`${authBaseUrl}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // The auth server requires an Origin; forward the caller's (trusted
      // localhost/dev origins are pre-approved on Neon Auth).
      Origin: c.req.header("origin") ?? "http://localhost:5173",
    },
    body: JSON.stringify({ email, password, name }),
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message =
      (payload as { message?: string }).message ?? `sign-up failed (${res.status})`
    return c.json({ error: message }, 400)
  }
  const user = (payload as { user?: { id?: string } }).user
  if (!user?.id) return c.json({ error: "sign-up returned no user" }, 500)

  await pool.query('update neon_auth."user" set role = $1 where id = $2', [role, user.id])
  return c.json({ id: user.id, email, name, role }, 201)
})

routes.delete("/staff/:id", adminGuard, async (c) => {
  const id = c.req.param("id")
  const caller = c.get("caller")
  if (caller.id === id) {
    return c.json({ error: "You cannot delete your own account" }, 400)
  }
  const { rows } = await pool.query(
    'delete from neon_auth."user" where id = $1 returning id, email, name, role',
    [id],
  )
  if (!rows[0]) return c.json({ error: "Unknown user" }, 404)
  await pool.query('delete from neon_auth."session" where "userId" = $1', [id])
  await pool.query('delete from neon_auth."account" where "userId" = $1', [id])
  return c.json({ ok: true, user: rows[0] })
})

export default routes
