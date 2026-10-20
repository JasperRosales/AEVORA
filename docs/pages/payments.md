# Payments

**Sidebar entry:** Payments
**Source:** `src/features/payments/payments-page.tsx`

Financial ledger of every transaction: reservation fees, down payments,
installments, and full payments.

## Page structure

### KPI strip

Four currency tiles, each showing a total with the number of contributing
payments as a sub-line:

- **Paid Payments** — sum of `Paid` payments.
- **Pending Payments** — sum of `Pending` payments.
- **Overdue Payments** — sum of `Overdue` payments.
- **Total Collected Payments** — same as Paid, framed against all payments.

Amounts are formatted with `formatCurrency` (₱, `en-PH` locale).

### Payment Records table

Filter row:

- **Search** — matches receipt number, client name, or plot number.
- **Status** — All / Paid / Pending / Overdue.
- **Method** — All / Cash / Bank Transfer / Card / Online.
- **Clear Filters** — resets all controls.
- A right-aligned summary re-states the pending and overdue totals.

Columns: Receipt No., Client, Plot, Type (Reservation Fee / Down Payment /
Installment / Full Payment), Amount, Date, Method, Status badge, and
Edit/Delete row actions. Paginated at 8 rows per page.

## Data

Payments come from the shared staff store (`/payments`, staff-guarded). The
same records feed the client portal's Payments tab (scoped to the family) and
the revenue charts on [Reports](reports.md).

New transactions are logged with the **Record Payment** quick action on the
[Overview](overview.md) page (`POST /payments`); the server assigns the next
`OR-##` receipt number and copies the cemetery from the selected plot.
