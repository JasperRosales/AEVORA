# Agreements

**Sidebar entry:** Agreements
**Source:** `src/features/agreements/agreements-page.tsx`

Registry of the legal documents tied to plot reservations: reservation
agreements, deeds of sale, and maintenance agreements.

## Page structure

### KPI strip

Total Agreements, Pending, Active, and Completed (counts by `status`).

### Agreement Records table

Filter row:

- **Search** — matches agreement number, client name, or plot number.
- **Status** — All / Pending / Active / Completed / Cancelled.
- **Type** — All / Reservation Agreement / Deed of Sale / Maintenance
  Agreement.
- **Clear Filters** — resets all controls.

Columns: Agreement No., Client, Plot, Cemetery, Type, Date Signed, Status
badge, and Edit/Delete row actions. Paginated at 8 rows per page.

## Data

Agreements come from the shared staff store (`/agreements`, staff-guarded).
Client accounts see their own agreements through the portal's
`/client/agreements` endpoint (there is no agreements tab in the portal UI
yet, but the data is served and available).
