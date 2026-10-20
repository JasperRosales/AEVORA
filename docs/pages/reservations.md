# Reservations

**Sidebar entry:** Reservations
**Source:** `src/features/reservations/reservations-page.tsx`

Where staff track every plot reservation from intake through verification to
confirmation — including the uploaded documents for each one.

## Page structure

### KPI strip

Pending Reservations, Reservations Under Verification, Confirmed, and
Cancelled (counts by `status`).

### Reservation Records table

Filter row:

- **Search** — matches client name, reservation number, or plot number.
- **Status** — All / Pending / Under Verification / Confirmed / Cancelled.
- **Verification** — All / Waiting for Checking / Under Review / Verified /
  Requires Action.
- **Burial Type** — All / Private / Vertical / Public.
- **Clear Filters** — resets all controls.

Columns: Reservation No., Client, Cemetery, Plot, Date, Burial Type,
Verification badge, Status badge, and row actions (Edit, Delete, **Files**).

The table paginates 8 rows per page.

### Attachments (`ReservationFiles`)

Clicking **Files** on a row expands an attachment manager beneath the table:

- Lists every file uploaded for that reservation (name, size, upload time),
  fetched from `GET /reservations/:id/attachments`. Each link is a short-lived
  **presigned URL** into the Neon Object Storage `assets` bucket.
- **Upload file** posts a multipart form to the same endpoint; the server
  stores the object under `attachments/<reservationId>/<uuid>-<name>` and
  records a row in the `attachments` table.
- Errors (e.g. backend unreachable) surface inline.

The same files are visible to the owning family in the
[client portal's Reservations tab](client-portal.md).

## Data

Reservations and attachments come from the shared staff store; attachment
list/upload go through `src/lib/neon-api.ts` → API function → Object Storage.

New reservations are created with the **Create Reservation** quick action on
the [Overview](overview.md) page (`POST /reservations`): picking an available
plot books it (status → `Reserved`, `reservedFor` set), increments the client's
reservation count, and creates the reservation as `Pending` /
`Waiting for Checking`. **Review Information Checking** on the Overview also
lands here.
