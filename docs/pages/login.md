# Login Page

**Route:** shown whenever the session is signed out (the app's entry screen)
**Source:** `src/features/auth/login-page.tsx` · session logic in `src/data/session.ts`, `src/lib/auth.ts`

The login screen is the first thing any unauthenticated visitor sees. It stays in
the initial JavaScript bundle (every other screen is lazy-loaded) so sign-in is
never delayed by a chunk fetch.

## What it does

- Collects **email** and **password** and calls `signIn()`, which uses the Neon
  Auth (Managed Better Auth) client's `signIn.email()` method.
- On success, `refreshSession()` runs: it reads the browser session cookie,
  fetches `/api/me` with the freshly minted JWT to resolve the user's **role**,
  and the app routes accordingly:

  | Role               | Destination                                             |
  | ------------------ | ------------------------------------------------------- |
  | `admin` / `staff`  | Staff dashboard (sidebar layout)                        |
  | `client`           | Mobile client portal                                    |
  | anything else      | Staff shell, but all staff-only API routes return 403   |

- On failure, the error message from the auth server is displayed inline above
  the submit button.

## Notes

- If `VITE_NEON_AUTH_URL` is missing, the auth client is not created and
  signing in reports "Authentication is not configured".
- The page is presentational only — it does not talk to the API function
  directly; all auth goes through the Neon Auth session cookie + JWT flow.
- Sessions persist across reloads (cookie-based) via `refreshSession()` called
  in `App.tsx` on mount.
