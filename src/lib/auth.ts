import { createAuthClient } from "@neondatabase/auth"
import { BetterAuthReactAdapter } from "@neondatabase/auth/react/adapters"

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL as string | undefined

export const isAuthConfigured = Boolean(AUTH_URL)

/** Managed Better Auth client (Neon wrapper — pinned plugins, JWT handling). */
export const authClient = isAuthConfigured
  ? createAuthClient(AUTH_URL!, { adapter: BetterAuthReactAdapter() })
  : null

let cached: { token: string; exp: number } | null = null

export function clearAuthToken() {
  cached = null
}

/**
 * Short-lived Neon Auth JWT (EdDSA, 15 min) for calling the API function.
 * Cached until close to expiry; the wrapper mints it from the session cookie.
 */
export async function getAuthToken(): Promise<string | null> {
  if (!authClient) return null
  if (cached && cached.exp > Date.now() + 30_000) return cached.token
  const { data, error } = await authClient.token()
  // The Neon adapter maps `/token` onto its get-session hook, so the JWT can
  // arrive either as `{ token }` or nested in the session payload as
  // `{ session: { token } }` depending on the adapter version.
  const token =
    (data as { token?: string } | null)?.token ??
    (data as { session?: { token?: string } } | null)?.session?.token
  if (error || !token) return null
  cached = { token, exp: jwtExp(token) ?? Date.now() + 14 * 60_000 }
  return token
}

function jwtExp(jwt: string): number | null {
  try {
    const payload = JSON.parse(
      atob(jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as { exp?: number }
    return typeof payload.exp === "number" ? payload.exp * 1000 : null
  } catch {
    return null
  }
}
