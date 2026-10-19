# Clients

**Sidebar entry:** Clients
**Source:** `src/features/clients/clients-page.tsx`

The client register: everyone (individuals and corporations) who holds or has
requested a plot.

## Page structure

### KPI strip

Total Clients, Active, Inactive, and Pending (counts by `status`).

### Client Records table

Filter row:

- **Search** — matches full name, client ID, or email (case-insensitive).
- **Type** — All / Individual / Corporate.
- **Status** — All / Active / Inactive / Pending.
- **Clear Filters** — resets all controls.

Columns: Client ID, Full Name, Contact, Email, Type, Registered date, Status
badge, and Edit/Delete row actions. Paginated at 8 rows per page.

## The client ↔ account link

A row in the `clients` table is the bridge between a family's records and the
system:

- The **client portal** looks up the signed-in user's auth email in this table
  (`clientRowFor()` in `api/lib/auth.ts`) and only returns rows belonging to
  that client — reservations match on `client_name = clients.full_name`.
- An admin creates a login for a client by adding a user with the **client**
  role and the same email (see [Staff Accounts](staff-accounts.md)).

## Notes

- Edit/Delete buttons are presentational in the current build.
- No personal data beyond what the table shows is exposed to the portal; the
  portal profile tab re-reads these fields server-side.
