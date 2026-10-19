import { createRemoteJWKSet, jwtVerify } from "jose"
import type { Context, Next } from "hono"
import { pool } from "./db"

const API_KEY = process.env.API_KEY
const AUTH_BASE = process.env.NEON_AUTH_BASE_URL

const jwks =
  AUTH_BASE && process.env.NEON_AUTH_JWKS_URL
    ? createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL))
    : null

/** Issuer = origin of the auth base URL (no path). */
export const authIssuer = AUTH_BASE ? new URL(AUTH_BASE).origin : null
export const authBaseUrl = AUTH_BASE ?? null

export interface Caller {
  id: string
  email: string
  name: string
  role: string
}

export type AppEnv = { Variables: { caller: Caller } }

/** Accepts a Neon Auth JWT (any signed-in user) or the ops API_KEY. */
async function identify(req: {
  header: (name: string) => string | undefined
}): Promise<Caller | null> {
  const token = req.header("authorization")?.replace(/^Bearer /i, "")
  if (!token) return null
  if (API_KEY && token === API_KEY) {
    return { id: "api-key", email: "ops@aevora.local", name: "API Key", role: "admin" }
  }
  if (!jwks) return null
  try {
    const { payload } = await jwtVerify(
      token,
      jwks,
      authIssuer ? { issuer: authIssuer } : undefined,
    )
    if (!payload.sub) return null
    const { rows } = await pool.query(
      'select id, email, name, role from neon_auth."user" where id = $1',
      [payload.sub],
    )
    return (rows[0] as Caller) ?? null
  } catch {
    return null
  }
}

/** Any signed-in user (or the ops key). */
export async function authGuard(c: Context<AppEnv>, next: Next) {
  const caller = await identify(c.req)
  if (!caller) return c.json({ error: "Unauthorized" }, 401)
  c.set("caller", caller)
  await next()
}

/** Account management (create/delete users) — admin only. */
export async function adminGuard(c: Context<AppEnv>, next: Next) {
  const caller = await identify(c.req)
  if (!caller) return c.json({ error: "Unauthorized" }, 401)
  if (caller.role !== "admin") return c.json({ error: "Admin only" }, 403)
  c.set("caller", caller)
  await next()
}

/** Staff-facing listing routes: admin or staff. Clients never list everything. */
export async function staffGuard(c: Context<AppEnv>, next: Next) {
  const caller = await identify(c.req)
  if (!caller) return c.json({ error: "Unauthorized" }, 401)
  if (caller.role !== "admin" && caller.role !== "staff") {
    return c.json({ error: "Staff only" }, 403)
  }
  c.set("caller", caller)
  await next()
}

/**
 * Attachment routes: staff/admin pass; clients only for their own reservation
 * (the reservation id comes from the `:id` route param).
 */
export async function attachmentGuard(c: Context<AppEnv>, next: Next) {
  const caller = await identify(c.req)
  if (!caller) return c.json({ error: "Unauthorized" }, 401)
  if (caller.role !== "admin" && caller.role !== "staff") {
    const reservationId = c.req.param("id")
    if (!reservationId || !(await ownsReservation(caller, reservationId))) {
      return c.json({ error: "Not your reservation" }, 403)
    }
  }
  c.set("caller", caller)
  await next()
}

/**
 * Finds the `clients` row belonging to a user by email — the link between a
 * Neon Auth account (role "client") and that family's cemetery records.
 */
export async function clientRowFor(email: string) {
  const { rows } = await pool.query(
    "select * from clients where lower(email) = lower($1) limit 1",
    [email],
  )
  return rows[0] ?? null
}

/** For client-role callers, verifies a reservation belongs to them. */
export async function ownsReservation(
  caller: Caller,
  reservationId: string,
): Promise<boolean> {
  if (caller.role === "admin" || caller.role === "staff") return true
  const client = await clientRowFor(caller.email)
  if (!client) return false
  const { rows } = await pool.query(
    "select 1 from reservations where id = $1 and client_name = $2",
    [reservationId, client.full_name],
  )
  return rows.length > 0
}
