import { randomUUID } from "node:crypto"
import { Hono } from "hono"
import { adminGuard, authBaseUrl, authGuard, provisionClientAccount, type AppEnv } from "../lib/auth"
import { db, pool } from "../services/database"
import * as schema from "../db/schema"

/** Who am I + admin-only account management (staff, admin and client users). */
const routes = new Hono<AppEnv>()

routes.get("/me", authGuard, (c) => c.json(c.get("caller")))

/**
 * Family self-registration — the public door to the client portal. Creates the
 * `clients` row and the Neon Auth account (role "client") in one step, so the
 * account list stays derived from the client records. Unguarded by design:
 * anyone may register, but only as a client, and only with their own contact
 * details. The email is unique — a duplicate is refused.
 */
routes.post("/register/client", async (c) => {
  const body = await c.req.json<{
    fullName?: string
    contactNumber?: string
    email?: string
    password?: string
  }>()
  const fullName = body.fullName?.trim()
  const contactNumber = body.contactNumber?.trim()
  const email = body.email?.trim().toLowerCase()
  const password = body.password ?? ""
  if (!fullName || !contactNumber || !email || !password) {
    return c.json(
      { error: "Full name, contact number, email and password are required" },
      400
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: "Enter a valid email address" }, 400)
  }
  if (password.length < 8) {
    return c.json({ error: "Password must be at least 8 characters" }, 400)
  }

  // One account per family email — checked in both worlds (client record and
  // auth user) since either one alone would half-work.
  const { rows: existingClient } = await pool.query(
    "select id from clients where lower(email) = lower($1) limit 1",
    [email]
  )
  if (existingClient.length > 0) {
    return c.json(
      { error: "An account with this email already exists" },
      409
    )
  }
  const { rows: existingUser } = await pool.query(
    'select 1 from neon_auth."user" where lower(email) = lower($1)',
    [email]
  )
  if (existingUser.length > 0) {
    return c.json({ error: "An account with this email already exists" }, 409)
  }

  // Reserve the next client code atomically enough for a registration form
  // (same nextCode scheme the staff create flow uses).
  const { rows: codes } = await pool.query('select client_id from clients')
  const max = codes.reduce(
    (top: number, r: { client_id: string }) => {
      const match = /(\d+)$/.exec(r.client_id)
      return match ? Math.max(top, Number(match[1])) : top
    },
    0
  )
  const clientId = `CL-${String(max + 1).padStart(3, "0")}`

  const [row] = await db
    .insert(schema.clients)
    .values({
      id: randomUUID(),
      clientId,
      fullName,
      contactNumber,
      email,
      type: "Individual",
      registeredAt: new Date().toISOString().slice(0, 10),
      status: "Active",
      reservations: 0,
    })
    .returning()

  const portal = await provisionClientAccount(
    fullName,
    email,
    c.req.header("origin"),
    password
  )
  if (!portal.ok) {
    // No account, no client record — registration has to be all-or-nothing or
    // the email would be permanently blocked by a half-created row.
    await db.delete(schema.clients).where(eq(schema.clients.id, row.id))
    return c.json({ error: portal.error }, portal.status ?? 502)
  }

  return c.json({ id: row.id, clientId: row.clientId, email }, 201)
})

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
