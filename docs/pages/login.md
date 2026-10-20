# Login Pages

**Routes:** `/login` (admin/staff) · `/client/login` (family portal)
**Sources:** `src/features/auth/admin-login-page.tsx`,
`src/features/auth/client-login-page.tsx` · shared form logic in
`src/features/auth/sign-in-form.ts` · session logic in `src/data/session.ts`,
`src/lib/auth.ts`

Each portal has its own login screen, its own component, and its own URL
endpoint — there is no shared login page. Both stay in the initial JavaScript
bundle (every other screen is lazy-loaded) so sign-in is never delayed by a
chunk fetch.

| Screen             | URL              | Design                                                  |
| ------------------ | ---------------- | ------------------------------------------------------- |
| `AdminLoginPage`   | `/login`         | Navy dashboard aesthetic: logo lockup, cream card        |
| `ClientLoginPage`  | `/client/login`  | Mobile-first: cream page, white card, teal accents       |

## What they do

- Collect **email** and **password** and call `signIn()`, which uses the Neon
  Auth (Managed Better Auth) client's `signIn.email()` method. The shared form
  hook (`useSignInForm`) is used by both screens; only the presentation
  differs.
- **The wrong audience is rejected at the form.** A staff/admin account on
  `/client/login` (or a client account on `/login`) is signed straight back out
  and shown an error naming the correct URL — the wrong portal's dashboard
  never renders. The same check in `App.tsx` covers signed-in users who navigate
  to the wrong side's URL directly.
- On success, `refreshSession()` runs: it reads the browser session cookie,
  fetches `/me` with the freshly minted JWT to resolve the user's **role**,
  and the endpoint plus role decide what renders:

  | Condition                                    | Destination                                             |
  | -------------------------------------------- | ------------------------------------------------------- |
  | `/login`, `admin` / `staff` role             | Staff dashboard (sidebar layout)                        |
  | `/login`, `client` role                      | Signed out — error pointing to `/client/login`          |
  | `/client/login`, `client` role               | Mobile client portal                                    |
  | `/client/login`, staff/admin role            | Signed out — error pointing to `/login`                 |
  | `/login`, any other role                     | Staff shell, but all staff-only API routes return 403   |

- On failure, the error message from the auth server is displayed inline above
  the submit button.
- Signed-out visits to `/` or `/client` are pointed at the matching login
  endpoint via `history.replaceState` (no reload), and signed-in visits to a
  login endpoint are pointed at the app (`vercel.json` rewrites both endpoints
  to the SPA).

## Client accounts come from the client records

Portal logins are **not** created on an accounts page. When staff add a client
on the Overview quick action ("Add Client"), the API provisions the family's
Neon Auth account (role `client`) in the same step and returns a one-time
password, which the modal shows before it closes. Editing a client's email
follows through to the auth account; deleting the client removes it (and its
sessions) too.

---

## Signing in

The site has two entry points:

- **Staff/admin:** **`/login`** (e.g. `https://aevora-iota.vercel.app/login`) —
  accepts staff and admin accounts. Accounts are created by an admin (see
  [Staff Accounts](staff-accounts.md)).
- **Client:** **`/client/login`** (e.g.
  `https://aevora-iota.vercel.app/client/login`) — a client-role account whose
  email matches a row in the `clients` table (auto-provisioned when the client
  is added). The portal then shows only that family's records.

A role that signs in on the wrong endpoint is signed out and shown an error
saying which URL to use.
