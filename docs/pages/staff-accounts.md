# Staff Accounts (Hidden Admin Page)

**Reachable at:** `#/staff-accounts` (not in the sidebar; admin role required)
**Source:** `src/features/staff/staff-accounts-page.tsx` · API in
`api/routes/account-routes.ts`

Account management for the whole system — staff, admin, and client logins. It
is deliberately undiscoverable: the route is absent from the sidebar, and any
non-admin who opens the hash gets a plain 404 (`src/App.tsx`).

## Who can use it

- The URL only works for users whose Neon Auth role is `admin`.
- Server-side, every endpoint it calls carries `adminGuard`
  (`api/lib/auth.ts`), so the page cannot be bypassed with a direct API call.

## Page structure

### Header

Back button (returns to the Overview page), the current admin's email and role,
and a Refresh button.

### Create Account card

A form with:

- **Full name**, **Email**, **Password** (min. 8 characters).
- **Role** — Staff / Admin / Client.

Submitting calls `POST /staff`. The API creates the account server-to-server
through the Neon Auth sign-up route, then promotes the new user's role in the
`neon_auth."user"` table. Success and failure messages appear as inline
banners.

> Tip: to give a family portal access, create an account with role **client**
> using the same email as their row in the `clients` table — that email match
> is what links the login to their records (see
> [Clients](clients.md)).

### Accounts table

Lists every account (name, email, role chip, created date) from
`GET /staff`. The signed-in admin cannot delete their own account — the Delete
button is hidden for that row; otherwise it confirms and calls
`DELETE /staff/:id`, which also removes the user's sessions and accounts rows.

## Related

- [Login](login.md) — how those accounts sign in.
- [Client Portal](client-portal.md) — what a client-role account sees.
