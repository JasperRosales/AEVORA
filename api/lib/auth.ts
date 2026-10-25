import { randomBytes } from "node:crypto"
import { createRemoteJWKSet, jwtVerify } from "jose"
import type { Context, Next } from "hono"
import { pool } from "./db"

const API_KEY = process.env.API_KEY
const AUTH_BASE = process.env.NEON_AUTH_BASE_URL?.replace(/\/+$/, "") ?? null
const AUTH_ORIGIN = AUTH_BASE ? new URL(AUTH_BASE).origin : null

const jwks =
  AUTH_BASE && process.env.NEON_AUTH_JWKS_URL
    ? createRemoteJWKSet(new URL(process.env.NEON_AUTH_JWKS_URL))
    : null

/**
 * Neon Auth signs session JWTs (the ones the SPA sends) with `iss` set to the
 * auth origin, while its anonymous-token endpoint uses the full base URL with
 * the `/neondb/auth` path. Accept both — the signature is still verified
 * against the branch JWKS, so this only widens the issuer claim check.
 */
export const authIssuer = AUTH_ORIGIN
const authIssuers =
  AUTH_ORIGIN && AUTH_BASE && AUTH_BASE !== AUTH_ORIGIN
    ? [AUTH_ORIGIN, AUTH_BASE]
    : AUTH_ORIGIN ?? undefined
export const authBaseUrl = AUTH_BASE

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
      authIssuers ? { issuer: authIssuers } : undefined,
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

/**
 * Provisions the Neon Auth account (role "client") that belongs to a
 * `clients` row, so the family can sign in at the client portal. Called when
 * staff add a client — the client table, not the accounts page, is the source
 * of truth for portal access — and by family self-registration. Returns the
 * one-time password for staff to hand over (when none was supplied), or a
 * structured failure the caller can report.
 */
export async function provisionClientAccount(
  name: string,
  email: string,
  origin?: string,
  password?: string
): Promise<
  | { ok: true; tempPassword: string }
  | { ok: false; error: string; status?: number }
> {
  if (!authBaseUrl) return { ok: false, error: "Neon Auth is not enabled", status: 500 }
  const tempPassword = password ?? randomBytes(9).toString("base64url") // 12 chars, high entropy
  const res = await fetch(`${authBaseUrl}/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // The auth server requires an Origin; forward the caller's (trusted
      // localhost/dev origins are pre-approved on Neon Auth).
      Origin: origin ?? "http://localhost:5173",
    },
    body: JSON.stringify({ email, name, password: tempPassword }),
  })
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as {
      message?: string
    }
    return {
      ok: false,
      error: payload.message ?? `sign-up failed (${res.status})`,
      status: res.status,
    }
  }
  const user = (await res.json().catch(() => ({}))) as { user?: { id?: string } }
  if (!user.user?.id) return { ok: false, error: "sign-up returned no user", status: 502 }
  await pool.query('update neon_auth."user" set role = $1 where id = $2', [
    "client",
    user.user.id,
  ])
  return { ok: true, tempPassword }
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
