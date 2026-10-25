import { useSyncExternalStore } from "react"
import { authClient, clearAuthToken, isAuthConfigured } from "@/lib/auth"
import { apiGet } from "@/lib/neon-api"

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
    // Token failed but a browser session exists — still let them in; the
    // server will refuse unauthorized API calls.
    // Fall back to the role on the auth session itself, not a hard-coded
    // "user": a client must not be treated as the wrong audience just because
    // /me was temporarily unreachable.
    set({
      status: "signedin",
      user: {
        id: data.user.id,
        email: data.user.email ?? "",
        name: data.user.name ?? "",
        role: (data.user as { role?: string }).role ?? "user",
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
