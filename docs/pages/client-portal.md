# Client Portal (Mobile App)

**Who sees it:** any signed-in user whose role is `client`
**Source:** `src/features/client/` (`client-app.tsx`, `client-home-tab.tsx`,
`client-reservations-tab.tsx`, `client-payments-tab.tsx`,
`client-profile-tab.tsx`, `client-ui.tsx`) · data in `src/data/client-store.ts`
· API in `src/lib/client-api.ts` → `api/routes/client-routes.ts`

The client portal is the mobile-first side of Aevora for families with a
reservation. When a `client`-role user signs in, `App.tsx` renders this instead
of the staff dashboard — the sidebar, header, and all staff-only data fetches
are skipped entirely.

## Shell (`ClientApp`)

- Phone-first layout: single column capped at `max-w-md`, centered on desktop.
- Sticky navy top bar with the Aevora logo, the user's name, and a sign-out
  button.
- Fixed bottom tab bar with four tabs (44px+ touch targets, safe-area padding):
  **Home**, **Reservations**, **Payments**, **Profile**.
- On mount it calls `ensureClientDataLoaded()`, which fetches all four client
  endpoints at once (summary, reservations, payments, agreements).

## Security model

Every `/client/*` endpoint is scoped **server-side**: the API matches the
caller's auth email to their row in `clients` and returns only records where
`client_name` equals that client's full name (`api/routes/client-routes.ts`,
`clientRowFor()` in `api/lib/auth.ts`). The UI never passes an owner ID — a
client physically cannot see another family's data. If the email matches no
`clients` row, the portal shows a "not yet linked" notice.

## Tabs

### Home (`HomeTab`)

- Welcome card with the client's full name and client ID.
- Two stat tiles: reservation count and total paid (sum of `Paid` payments).
- **Next reservation** card: the earliest non-cancelled reservation with its
  number, status badge, plot, burial type, schedule date, and verification
  status — or "No upcoming reservations."
- A button that jumps to the Reservations tab.

### Reservations (`ReservationsTab`)

- A card per reservation: number, status badge, plot, burial type, cemetery +
  location, and scheduled date.
- Tapping a card expands its **document manager** (`ReservationFiles`):
  - Lists uploaded documents with size and date, each with a download button
    (short-lived presigned URL from Neon Object Storage, refreshed on every
    fetch).
  - Upload a document (multipart POST; triggers a data reload so counts stay
    fresh).
  - Delete a document (with confirmation). Ownership is re-checked server-side
    by `attachmentGuard`.
- A Refresh button re-fetches all portal data (`reloadClientData()`).

### Payments (`PaymentsTab`)

- A card per payment: receipt number, status badge, amount (₱), payment type
  (Reservation Fee / Down Payment / Installment / Full Payment), plot,
  cemetery, method, and date.
- Sorted newest first by the server.

### Profile (`ProfileTab`)

- Avatar (initials), name, email, and a `client` role chip from the auth
  session.
- **Account details** card from the linked `clients` row: Client ID, contact,
  type (Individual/Corporate), registered date, and status.
- Sign-out button and a footer.

## Data plumbing

`src/data/client-store.ts` is a small `useSyncExternalStore` store with
`status` (`idle | loading | ready | error`), the summary, and the three
collections. Tabs render a spinner while loading and an error note on failure.
Agreements are fetched with the rest and served by `/client/agreements`, but no
tab displays them yet.

## Related

- [Reservations (staff)](reservations.md) — staff manage the same reservations
  and files from the dashboard.
- [Clients (staff)](clients.md) — how a client account is linked to a record.
