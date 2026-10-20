import { useState, type FormEvent } from "react"
import { signIn, signOut } from "@/data/session"

/** Which portal the login screen belongs to — admin site or client portal. */
export type LoginSide = "admin" | "client"

export const WRONG_SIDE_MESSAGE: Record<LoginSide, string> = {
  admin:
    "This account cannot sign in on the main site. Clients sign in on the client portal.",
  client:
    "This account cannot sign in on the client portal. Staff and admin accounts sign in on the main site.",
}

/**
 * Sign-in form state shared by both login screens (one model, two designs).
 * A role that doesn't match the portal is rejected here, at the form: the
 * account is signed straight back out and told which URL to use, instead of
 * being let in and bounced by the App-level mismatch effect.
 */
export function useSignInForm(notice: string | null, side: LoginSide) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Surface a pending sign-out notice (role/portal mismatch) as the error.
  // Compared against the last seen value so a later sign-in error isn't
  // clobbered — the recommended adjust-state-during-render pattern.
  const [seenNotice, setSeenNotice] = useState(notice)
  if (notice !== seenNotice) {
    setSeenNotice(notice)
    setError(notice)
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await signIn(email.trim(), password)
      const role = user?.role
      // The client portal is for client accounts only; the main site is for
      // everyone else. Reject the wrong audience at the form.
      const wrongRole =
        side === "client" ? role !== "client" : role === "client"
      if (wrongRole) {
        await signOut()
        setError(WRONG_SIDE_MESSAGE[side])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed")
    } finally {
      setBusy(false)
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    busy,
    onSubmit,
  }
}
