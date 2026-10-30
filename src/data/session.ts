import { useSyncExternalStore } from "react"
import { authClient, clearAuthToken, isAuthConfigured } from "@/lib/auth"
import { apiGet } from "@/lib/neon-api"
import type { ClientSummary } from "@/lib/client-api"

export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
}

interface SessionState {
  status: "loading" | "signedout" | "signedin"
  user: SessionUser | null
}

let state: SessionState = {
  status: isAuthConfigured ? "loading" : "signedout",
  user: null,
}
const listeners = new Set<() => void>()

function set(patch: Partial<SessionState>) {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSessionState(): SessionState {
  return state
}

/** Restores the session on reload (cookie-based) and resolves the user's role. */
export async function refreshSession() {
  if (!authClient) {
    set({ status: "signedout", user: null })
    return
  }
  const { data } = await authClient.getSession()
  if (!data?.user) {
    clearAuthToken()
    set({ status: "signedout", user: null })
    return
  }
  try {
    const me = await apiGet<SessionUser>("/me")
    set({ status: "signedin", user: me })
  } catch {
    // On mobile, a transient failure on /me must not turn a client into a
    // generic "user" and trigger the wrong-portal sign-out. Verify client
    // identity through the separately scoped client endpoint before falling
    // back to the auth session.
    const authRole = (data.user as { role?: string }).role
    let client: ClientSummary["client"] = null
    if (!authRole || authRole === "user") {
      try {
        const summary = await apiGet<ClientSummary>("/client/summary")
        client = summary.client
      } catch {
        // Keep the auth-session fallback below if the API is unavailable.
      }
    }

    set({
      status: "signedin",
      user: {
        id: data.user.id,
        email: client?.email ?? data.user.email ?? "",
        name: client?.fullName ?? data.user.name ?? "",
        role: client ? "client" : (authRole ?? "user"),
      },
    })
  }
}

export async function signIn(
  email: string,
  password: string
): Promise<SessionUser | null> {
  if (!authClient) throw new Error("Authentication is not configured")
  const { error } = await authClient.signIn.email({ email, password })
  if (error) throw new Error(error.message ?? "Sign-in failed")
  clearAuthToken()
  await refreshSession()
  // The signed-in user, so callers (e.g. the login forms) can check the role
  // against the portal they signed in on.
  return state.user
}

export async function signOut() {
  if (authClient) await authClient.signOut()
  clearAuthToken()
  set({ status: "signedout", user: null })
}

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSessionState, getSessionState)
}
