# Client Portal (Mobile App)

**Who sees it:** any signed-in user whose role is `client`
**Source:** `src/features/client/` (`client-app.tsx`, `client-home-tab.tsx`,
`client-plots-tab.tsx`, `client-reservations-tab.tsx`,
`client-payments-tab.tsx`, `client-payment-sheet.tsx`, `client-profile-tab.tsx`,
`client-ui.tsx`) · data in `src/data/client-store.ts`
· API in `src/lib/client-api.ts` → `api/routes/client-routes.ts`

The client portal is the mobile-first side of Aevora for families buying and
holding plots. It has its own URL — **`/client`** on the same site, with its own
login screen at **`/client/login`** — so families and staff use distinct entry
points. When the app loads under `/client`, `App.tsx` renders this instead of
the staff dashboard — the sidebar, header, and all staff-only data fetches are
skipped entirely. Sign-in is enforced per side: a `client` account on the main
site (or a staff/admin account on `/client`) is signed out and shown a message
pointing to the correct URL, and the `/client/login` form itself rejects
non-client accounts. Client portal accounts are provisioned automatically when
staff add a client record. (The `/client/*` paths in the API are server
endpoints and unrelated to this front-end path.)

## Shell (`ClientApp`)

- Phone-first layout: single column capped at `max-w-md`, centered on desktop.
- Sticky navy top bar with the Aevora logo, the user's name, and a sign-out
  button.
- Fixed bottom tab bar with five tabs (44px+ touch targets, safe-area padding):
  **Home**, **Plots**, **Reservations**, **Payments**, **Profile**.
- On mount it calls `ensureClientDataLoaded()`, which fetches all five client
  endpoints at once (summary, plot catalogue, reservations, payments,
  agreements). Booking or paying reloads the same set so counts, balances and
  availability stay in sync.

## Security model

Every `/client/*` endpoint is scoped **server-side**: the API matches the
caller's auth email to their row in `clients` and returns only records where
`client_name` equals that client's full name (`api/routes/client-routes.ts`,
`clientRowFor()` in `api/lib/auth.ts`). The UI never passes an owner ID — a
client physically cannot see or spend another family's records.

The purchase routes follow the same rule:

- **The map requests every plot** with its status (`GET /client/plots?scope=all`)
  so the portal can draw the same grid the office uses; the default endpoint
  still returns only `Available` plots for the list. Owner details
  (`reserved_for`) are never selected. Reserving is still rejected unless the
  plot is `Available`.
- `POST /client/reservations` takes a plot id from the browser but takes the
  owner from the session. It locks the plot row, rejects anything not
  `Available`, and books it in a transaction.
- `POST /client/payments` accepts a reservation id and only matches it against
  the caller's own reservations. Plot, cemetery and client name are copied from
  that row, never trusted from the request.

If the email matches no `clients` row, the portal shows a "not yet linked"
notice and the write routes return `403`.

## Tabs

### Home (`HomeTab`)

- Welcome card with the client's full name and client ID.
- Two stat tiles: reservation count and total paid (sum of `Paid` payments).
- **Next reservation** card: the earliest non-cancelled reservation with its
  number, status badge, plot, burial type, schedule date, and verification
  status — or "No upcoming reservations."
- Two shortcuts: **Find a plot** (jumps to Plots) and **Reservations**.

### Plots (`PlotsTab`)

The buying journey starts here. The tab opens on the **Map** view for the first
cemetery that has an available plot, and can be switched to **List**.

- **Map** (`ClientPlotMap`): the same site-plan drawing the office uses
  (`PlotLandMap`), derived from the plots themselves (any number of sections,
  rows and columns). Sections are drawn as full-width land parcels, stacked on
  the narrow portal so cells stay readable, and the drawing scales to the portal
  width.
  - Cells are colored by status — green Available, blue Reserved, red Occupied,
    yellow Waiting for Checking, grey Unavailable — with a legend.
  - Tapping a cell opens a details sheet with the plot number, cemetery,
    section, row/column, burial type, size, price and status.
  - Only **Available** plots show a **Reserve this plot** button; other statuses
    explain that the plot can't be reserved right now.
  - The burial-type filter dims non-matching cells so the grid keeps its shape.
  - A cemetery selector chooses which layout to show; "All cemeteries" asks for
    a specific one.
- **List**: cards for every **Available** plot, eight at a time with a **Show
  more** step — number, cemetery + location, price, section, burial type and
  size, plus **Reserve this plot**.
- Filters for cemetery and burial type, a live available count, and a refresh
  button (the catalogue is loaded once at sign-in).
- **Reserve this plot** (from either view) opens a confirmation sheet: burial
  type (defaults to the plot's type) and preferred schedule date. Submitting
  creates the reservation, holds the plot for the family, and immediately opens
  the payment sheet so the reservation fee can be paid in the same sitting.
- After a booking, a banner confirms the reservation number and links to the
  Reservations tab. The plot turns Reserved on the map and drops out of the
  available list on the next load.
- If the account is not linked to a client record, the tab explains how to get
  registered instead of offering plots.

### Payment sheet (`PaymentSheet`)

Shared by the Plots and Reservations tabs.

- Shows the plot price, what is already committed (Paid + Pending submissions)
  and the balance.
- Payment type (Reservation Fee / Down Payment / Installment / Full Payment),
  an editable amount (pre-filled with a sensible share of the balance), and a
  method (Online / Card / Bank Transfer / Cash).
- Submitting posts to `POST /client/payments`. The server files the payment as
  **Pending** — the office confirms the money arrived and marks it Paid — so
  the UI shows the new receipt number and a clear "awaiting confirmation" note.
  Proof of payment can then be uploaded on the reservation. Closing the sheet
  with **I'll pay later** leaves the reservation payable from its card.
- A fully settled plot shows "no payment is due" instead of the form.

### Reservations (`ReservationsTab`)

- A card per reservation: number, status badge, plot, burial type, cemetery +
  location, and scheduled date.
- A balance row on every card. Reservations with money outstanding get a
  **Pay now** button that opens the payment sheet; settled ones read
  "Settled".
- Tapping a card expands its **document manager** (`ReservationFiles`):
  - Lists uploaded documents with size and date, each with a download button
    (short-lived presigned URL from Neon Object Storage, refreshed on every
    fetch).
  - Upload a document (multipart POST; triggers a data reload so counts stay
    fresh) — useful for proof of payment.
  - Delete a document (with confirmation). Ownership is re-checked server-side
    by `attachmentGuard`.
- A Refresh button re-fetches all portal data (`reloadClientData()`).
- With no reservations, the empty state links to the Plots tab.

### Payments (`PaymentsTab`)

- When a current reservation still owes money, a **Balance due** card totals it
  across plots and links back to Reservations with **Make a payment**.
- A card per payment: receipt number, status badge, amount (₱), payment type,
  plot, cemetery, method, and date.
- Portal submissions appear here immediately as `Pending`; staff confirm them
  from the dashboard.
- Sorted newest first by the server.

### Profile (`ProfileTab`)

- Avatar (initials), name, email, and a `client` role chip from the auth
  session.
- **Account details** card from the linked `clients` row: Client ID, contact,
  type (Individual/Corporate), registered date, and status.
- Sign-out button and a footer.

## Data plumbing

`src/data/client-store.ts` is a small `useSyncExternalStore` store with
`status` (`idle | loading | ready | error`), the summary, available plots and
the three collections. Tabs render a spinner while loading and an error note on
failure. Agreements are fetched with the rest and served by
`/client/agreements`, but no tab displays them yet.

Writing happens only through the two purchase endpoints; both reload the store
on success so the available list, reservation count, balances and payment
history all reflect the change without a manual refresh.

## Related

- [Reservations (staff)](reservations.md) — staff verify and confirm the same
  bookings.
- [Payments (staff)](payments.md) — staff confirm portal payments from the
  ledger.
- [Clients (staff)](clients.md) — how a client account is linked to a record.
