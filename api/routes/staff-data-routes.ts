import { randomUUID } from "node:crypto"
import { and, desc, eq, inArray } from "drizzle-orm"
import { Hono } from "hono"
import { provisionClientAccount, staffGuard, type AppEnv } from "../lib/auth"
import { db, pool } from "../lib/db"
import { isDate, nextCode, oneOf, str, today } from "../lib/records"
import * as schema from "../db/schema"

/**
 * Staff-only record routes: listings (GET) plus the create endpoints (POST)
 * behind the dashboard's quick actions. Each route carries its own guard;
 * row → domain shape mappers live here because only these endpoints need
 * them.
 */
const routes = new Hono<AppEnv>()

const CLIENT_TYPES = ["Individual", "Corporate"] as const
const CLIENT_STATUSES = ["Active", "Inactive", "Pending"] as const
const PLOT_CATEGORIES = [
  "Typical Block",
  "Premium Lot",
  "Special Premium Lot",
  "Lot with Trees",
] as const
const PLOT_STATUSES = [
  "Available",
  "Reserved",
  "Occupied",
  "Waiting for Checking",
  "Unavailable",
] as const
const PAYMENT_TYPES = [
  "Reservation Fee",
  "Down Payment",
  "Installment",
  "Full Payment",
] as const
const PAYMENT_STATUSES = ["Paid", "Pending", "Overdue"] as const
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "Online"] as const
const RESERVATION_STATUSES = [
  "Pending",
  "Under Verification",
  "Confirmed",
  "Cancelled",
] as const
const VERIFICATION_STATUSES = [
  "Waiting for Checking",
  "Under Review",
  "Verified",
  "Requires Action",
] as const
const AGREEMENT_TYPES = [
  "Reservation Agreement",
  "Deed of Sale",
  "Maintenance Agreement",
] as const
const AGREEMENT_STATUSES = [
  "Pending",
  "Active",
  "Completed",
  "Cancelled",
] as const
const REPORT_STATUSES = ["Ready", "Processing"] as const

routes.get("/cemeteries", staffGuard, async (c) =>
  c.json(await db.select().from(schema.cemeteries))
)

routes.get("/plots", staffGuard, async (c) => {
  const rows = await db.select().from(schema.plots)
  return c.json(rows.map(toPlot))
})

routes.get("/reservations", staffGuard, async (c) => {
  const rows = await db
    .select({
      reservation: schema.reservations,
      plotType: schema.plots.type,
    })
    .from(schema.reservations)
    .leftJoin(
      schema.plots,
      and(
        eq(schema.plots.cemeteryId, schema.reservations.cemeteryId),
        eq(schema.plots.plotNumber, schema.reservations.plotNumber)
      )
    )
  return c.json(
    rows.map(({ reservation, plotType }) => ({
      ...toReservation(reservation),
      plotCategory: plotType
        ? normalizePlotType(plotType)
        : normalizePlotType(reservation.plotCategory),
    }))
  )
})

routes.get("/clients", staffGuard, async (c) =>
  c.json(await db.select().from(schema.clients))
)

routes.get("/payments", staffGuard, async (c) =>
  c.json(await db.select().from(schema.payments))
)

routes.get("/agreements", staffGuard, async (c) =>
  c.json(await db.select().from(schema.agreements))
)

routes.get("/activities", staffGuard, async (c) =>
  c.json(await db.select().from(schema.activities))
)

// Newest first so the header feeds and Overview card agree on ordering.
routes.get("/notifications", staffGuard, async (c) =>
  c.json(
    await db
      .select()
      .from(schema.notifications)
      .orderBy(desc(schema.notifications.dateTime))
  )
)

// Newest first so a freshly generated report lands on page one, with the most
// recently created row winning when several share a date.
routes.get("/reports", staffGuard, async (c) =>
  c.json(
    await db
      .select()
      .from(schema.generatedReports)
      .orderBy(
        desc(schema.generatedReports.dateGenerated),
        desc(schema.generatedReports.id)
      )
  )
)

/* ------------------------- creates (quick actions) ------------------------- */

routes.post("/clients", staffGuard, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const fullName = str(body.fullName)
  const contactNumber = str(body.contactNumber)
  const email = str(body.email)
  if (!fullName || !contactNumber || !email) {
    return c.json(
      { error: "Full name, contact number and email are required" },
      400
    )
  }

  const existing = await db
    .select({ clientId: schema.clients.clientId })
    .from(schema.clients)
  const [row] = await db
    .insert(schema.clients)
    .values({
      id: randomUUID(),
      clientId: nextCode(
        existing.map((r) => r.clientId),
        "CL-",
        3
      ),
      fullName,
      contactNumber,
      email,
      type: oneOf(body.type, CLIENT_TYPES, "Individual"),
      registeredAt: today(),
      status: oneOf(body.status, CLIENT_STATUSES, "Active"),
      reservations: 0,
    })
    .returning()

  // The client record is also the source of truth for portal access: adding a
  // client provisions their Neon Auth account (role "client") in the same
  // step, so the family can sign in at /client/login without an admin
  // touching the accounts page. A failure here doesn't roll back the client
  // row — it's reported so staff can retry.
  const portal = await provisionClientAccount(
    fullName,
    email,
    c.req.header("origin")
  )

  return c.json(
    {
      ...row,
      portal: portal.ok
        ? { email, tempPassword: portal.tempPassword }
        : { email, error: portal.error },
    },
    201
  )
})

routes.post("/plots", staffGuard, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const cemeteryId = str(body.cemeteryId)
  const section = str(body.section).toUpperCase()
  const row = Number(body.row)
  const column = Number(body.column)
  const size = str(body.size)
  const price = Number(body.price)

  if (!cemeteryId || !section || !size) {
    return c.json({ error: "Cemetery, section and size are required" }, 400)
  }
  if (
    !Number.isInteger(row) ||
    row < 1 ||
    !Number.isInteger(column) ||
    column < 1
  ) {
    return c.json(
      { error: "Row and column must be whole numbers of 1 or more" },
      400
    )
  }
  if (!Number.isFinite(price) || price < 0) {
    return c.json({ error: "Price must be a positive amount" }, 400)
  }

  const [cemetery] = await db
    .select()
    .from(schema.cemeteries)
    .where(eq(schema.cemeteries.id, cemeteryId))
  if (!cemetery) return c.json({ error: "Unknown cemetery" }, 404)

  // Plot identity/number are derived from the location so the register stays
  // consistent with the seeded A-101 style codes.
  const id = `${cemeteryId}-${section}-${row}-${column}`
  const plotNumber = `${section}-${row}${String(column).padStart(2, "0")}`
  const clash = await db
    .select({ id: schema.plots.id })
    .from(schema.plots)
    .where(eq(schema.plots.id, id))
  if (clash.length > 0) {
    return c.json(
      { error: `Plot ${plotNumber} already exists in ${cemetery.name}` },
      409
    )
  }

  const [inserted] = await db
    .insert(schema.plots)
    .values({
      id,
      plotNumber,
      cemeteryId,
      section,
      row,
      column,
      size,
      price: Math.round(price),
      status: oneOf(body.status, PLOT_STATUSES, "Available"),
      type: oneOf(body.type, PLOT_CATEGORIES, "Typical Block"),
      groupName: str(body.groupName) || null,
      reservedFor: str(body.reservedFor) || null,
    })
    .returning()

  return c.json(toPlot(inserted), 201)
})

/**
 * Bulk layout builder: lays out a rectangular block of plots for one cemetery.
 * The admin picks one or more sections, a rows × columns block and a starting
 * cell, and every generated plot shares the same category/size/price. Existing
 * plot ids are skipped instead of failing the whole request, so a grid can be
 * extended or re-run safely. One request is capped at 500 plots.
 */
routes.post("/plots/grid", staffGuard, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const cemeteryId = str(body.cemeteryId)
  const rawSections = Array.isArray(body.sections)
    ? body.sections
    : str(body.sections).split(",")
  const sections = [
    ...new Set(
      rawSections.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
    ),
  ]
  const rows = Number(body.rows)
  const columns = Number(body.columns)
  const startRow = Number(body.startRow ?? 1)
  const startColumn = Number(body.startColumn ?? 1)
  const size = str(body.size)
  const price = Number(body.price)

  if (!cemeteryId || !size) {
    return c.json({ error: "Cemetery and plot size are required" }, 400)
  }
  if (sections.length === 0) {
    return c.json({ error: "Add at least one section" }, 400)
  }
  if (
    sections.length > 12 ||
    sections.some((section) => !/^[A-Z0-9]{1,3}$/.test(section))
  ) {
    return c.json(
      { error: "Sections must be 1–3 letters/numbers (up to 12 per grid)" },
      400
    )
  }
  if (
    !Number.isInteger(rows) ||
    rows < 1 ||
    rows > 50 ||
    !Number.isInteger(columns) ||
    columns < 1 ||
    columns > 50
  ) {
    return c.json({ error: "Rows and columns must be between 1 and 50" }, 400)
  }
  if (
    !Number.isInteger(startRow) ||
    startRow < 1 ||
    !Number.isInteger(startColumn) ||
    startColumn < 1
  ) {
    return c.json({ error: "Start row and column must be 1 or more" }, 400)
  }
  // Plot numbers pad the column to two digits (A-101); past 99 the number
  // becomes ambiguous, so keep generated columns inside that range.
  if (startColumn + columns - 1 > 99) {
    return c.json({ error: "Columns must end at 99 or less" }, 400)
  }
  if (!Number.isFinite(price) || price < 0) {
    return c.json({ error: "Price must be a positive amount" }, 400)
  }

  const total = sections.length * rows * columns
  if (total > 500) {
    return c.json(
      { error: `That grid is ${total} plots — the limit is 500 per request` },
      400
    )
  }

  const [cemetery] = await db
    .select()
    .from(schema.cemeteries)
    .where(eq(schema.cemeteries.id, cemeteryId))
  if (!cemetery) return c.json({ error: "Unknown cemetery" }, 404)

  const status = oneOf(body.status, PLOT_STATUSES, "Available")
  const type = oneOf(body.type, PLOT_CATEGORIES, "Typical Block")
  const groupName = str(body.groupName) || null
  const roundedPrice = Math.round(price)

  // Same identity/number scheme as the single Add Plot action, so a grid
  // extension lines up with rows created one at a time.
  const values = sections.flatMap((section) =>
    Array.from({ length: rows }).flatMap((_, r) =>
      Array.from({ length: columns }).map((_, col) => {
        const row = startRow + r
        const column = startColumn + col
        return {
          id: `${cemeteryId}-${section}-${row}-${column}`,
          plotNumber: `${section}-${row}${String(column).padStart(2, "0")}`,
          cemeteryId,
          section,
          row,
          column,
          size,
          price: roundedPrice,
          status,
          type,
          groupName,
          reservedFor: null,
        }
      })
    )
  )

  if (values.length === 0) {
    return c.json({ created: [], skipped: 0 }, 201)
  }

  // `onConflictDoNothing` handles the race where another admin creates the
  // same cell between this read and the insert; `returning` reports only the
  // rows this request actually added.
  const inserted = await db
    .insert(schema.plots)
    .values(values)
    .onConflictDoNothing()
    .returning()

  return c.json(
    {
      created: inserted.map(toPlot),
      skipped: values.length - inserted.length,
    },
    201
  )
})

routes.post("/reservations", staffGuard, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const clientId = str(body.clientId)
  const plotId = str(body.plotId)
  if (!clientId || !plotId) {
    return c.json({ error: "Client and plot are required" }, 400)
  }

  const [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.id, clientId))
  if (!client) return c.json({ error: "Unknown client" }, 404)
  const [plot] = await db
    .select()
    .from(schema.plots)
    .where(eq(schema.plots.id, plotId))
  if (!plot) return c.json({ error: "Unknown plot" }, 404)
  if (plot.status !== "Available") {
    return c.json(
      { error: `Plot ${plot.plotNumber} is ${plot.status.toLowerCase()}` },
      409
    )
  }

  const existing = await db
    .select({ reservationNumber: schema.reservations.reservationNumber })
    .from(schema.reservations)
  const date = isDate(str(body.date)) ? str(body.date) : today()
  const [reservation] = await db
    .insert(schema.reservations)
    .values({
      id: randomUUID(),
      reservationNumber: nextCode(
        existing.map((r) => r.reservationNumber),
        "R-",
        3
      ),
      clientName: client.fullName,
      cemeteryId: plot.cemeteryId,
      plotNumber: plot.plotNumber,
      date,
      plotCategory: oneOf(
        body.plotCategory,
        PLOT_CATEGORIES,
        oneOf(plot.type, PLOT_CATEGORIES, "Typical Block")
      ),
      status: "Pending",
      verification: "Waiting for Checking",
    })
    .returning()

  // Booking the plot is part of creating the reservation: the register and the
  // client's reservation count follow immediately.
  const [updatedPlot] = await db
    .update(schema.plots)
    .set({ status: "Reserved", reservedFor: client.fullName })
    .where(eq(schema.plots.id, plot.id))
    .returning()
  const [updatedClient] = await db
    .update(schema.clients)
    .set({ reservations: client.reservations + 1 })
    .where(eq(schema.clients.id, client.id))
    .returning()

  return c.json(
    {
      reservation: toReservation(reservation),
      plot: toPlot(updatedPlot),
      client: updatedClient,
    },
    201
  )
})

routes.post("/payments", staffGuard, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const clientId = str(body.clientId)
  const plotId = str(body.plotId)
  const amount = Number(body.amount)
  if (!clientId || !plotId) {
    return c.json({ error: "Client and plot are required" }, 400)
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return c.json({ error: "Amount must be greater than zero" }, 400)
  }

  const [client] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.id, clientId))
  if (!client) return c.json({ error: "Unknown client" }, 404)
  const [plot] = await db
    .select()
    .from(schema.plots)
    .where(eq(schema.plots.id, plotId))
  if (!plot) return c.json({ error: "Unknown plot" }, 404)

  const existing = await db
    .select({ receiptNumber: schema.payments.receiptNumber })
    .from(schema.payments)
  const [inserted] = await db
    .insert(schema.payments)
    .values({
      id: randomUUID(),
      receiptNumber: nextCode(
        existing.map((r) => r.receiptNumber),
        "OR-",
        2
      ),
      clientName: client.fullName,
      plotNumber: plot.plotNumber,
      type: oneOf(body.type, PAYMENT_TYPES, "Reservation Fee"),
      amount: Math.round(amount),
      date: isDate(str(body.date)) ? str(body.date) : today(),
      status: oneOf(body.status, PAYMENT_STATUSES, "Paid"),
      method: oneOf(body.method, PAYMENT_METHODS, "Cash"),
      cemeteryId: plot.cemeteryId,
    })
    .returning()

  return c.json(inserted, 201)
})

routes.post("/reports", staffGuard, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const type = str(body.type)
  if (!type) return c.json({ error: "Report type is required" }, 400)

  const caller = c.get("caller")
  const dateGenerated = today()
  const [inserted] = await db
    .insert(schema.generatedReports)
    .values({
      id: randomUUID(),
      name: str(body.name) || `${type} Report`,
      type,
      dateGenerated,
      generatedBy: caller.name || caller.email,
      status: "Ready",
    })
    .returning()

  return c.json(inserted, 201)
})

/* ------------------------------ edits (PATCH) ------------------------------ */

routes.patch("/clients/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json<Record<string, unknown>>()
  const [existing] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.id, id))
  if (!existing) return c.json({ error: "Unknown client" }, 404)

  const fullName = str(body.fullName) || existing.fullName
  const contactNumber = str(body.contactNumber) || existing.contactNumber
  const email = str(body.email) || existing.email
  if (!fullName || !contactNumber || !email) {
    return c.json(
      { error: "Full name, contact number and email are required" },
      400
    )
  }

  const [updated] = await db
    .update(schema.clients)
    .set({
      fullName,
      contactNumber,
      email,
      type: oneOf(body.type, CLIENT_TYPES, existing.type),
      status: oneOf(body.status, CLIENT_STATUSES, existing.status),
    })
    .where(eq(schema.clients.id, id))
    .returning()

  // The portal login is keyed on email (auth email → clients row); a rename
  // of the address has to follow through or the family loses portal access.
  if (email.toLowerCase() !== existing.email.toLowerCase()) {
    await pool.query(
      'update neon_auth."user" set email = $1 where lower(email) = lower($2)',
      [email, existing.email]
    )
  }
  return c.json(updated)
})

routes.delete("/clients/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const [existing] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.id, id))
  if (!existing) return c.json({ error: "Unknown client" }, 404)

  // Reservations reference the client by name; deleting the client first
  // would leave them orphaned, so the records must go the other way round.
  const held = await db
    .select({ id: schema.reservations.id })
    .from(schema.reservations)
    .where(eq(schema.reservations.clientName, existing.fullName))
  if (held.length > 0) {
    return c.json(
      {
        error: `Client has ${held.length} reservation(s) — delete them first`,
      },
      409
    )
  }

  await db.delete(schema.clients).where(eq(schema.clients.id, id))

  // Portal access goes with the record: drop the linked Neon Auth user (and
  // their sessions) so the family can no longer sign in at /client/login.
  const { rows: users } = await pool.query(
    'select id from neon_auth."user" where lower(email) = lower($1)',
    [existing.email]
  )
  if (users[0]) {
    await pool.query('delete from neon_auth."session" where "userId" = $1', [
      users[0].id,
    ])
    await pool.query('delete from neon_auth."account" where "userId" = $1', [
      users[0].id,
    ])
    await pool.query('delete from neon_auth."user" where id = $1', [
      users[0].id,
    ])
  }

  return c.json({ ok: true })
})

routes.patch("/plots/group", staffGuard, async (c) => {
  const body = await c.req.json<Record<string, unknown>>()
  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.map((id) => String(id)).filter(Boolean))]
    : []
  if (ids.length === 0) {
    return c.json({ error: "Select at least one plot" }, 400)
  }
  const rawPlacements = Array.isArray(body.placements) ? body.placements : []
  const placements = rawPlacements
    .map((entry) => {
      const record = entry as Record<string, unknown>
      const id = str(record.id)
      const row = Number(record.row)
      const column = Number(record.column)
      if (
        !ids.includes(id) ||
        !Number.isInteger(row) ||
        !Number.isInteger(column) ||
        row < 1 ||
        column < 1
      ) {
        return null
      }
      return { id, row, column }
    })
    .filter(
      (entry): entry is { id: string; row: number; column: number } =>
        entry !== null
    )

  if (
    body.groupName === undefined &&
    body.type === undefined &&
    placements.length === 0
  ) {
    return c.json({ error: "Nothing to update" }, 400)
  }

  const updated = await db.transaction(async (tx) => {
    if (body.groupName !== undefined || body.type !== undefined) {
      await tx
        .update(schema.plots)
        .set({
          ...(body.groupName === undefined
            ? {}
            : { groupName: str(body.groupName) || null }),
          ...(body.type === undefined
            ? {}
            : {
                type: oneOf(body.type, PLOT_CATEGORIES, "Typical Block"),
              }),
        })
        .where(inArray(schema.plots.id, ids))
    }
    // Grid grouping also rewrites row/column so the group keeps the requested
    // shape on the map (row, column, or a rows × columns block).
    for (const placement of placements) {
      await tx
        .update(schema.plots)
        .set({ row: placement.row, column: placement.column })
        .where(eq(schema.plots.id, placement.id))
    }
    return tx
      .select()
      .from(schema.plots)
      .where(inArray(schema.plots.id, ids))
  })

  return c.json(updated.map(toPlot))
})

routes.patch("/plots/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json<Record<string, unknown>>()
  const [existing] = await db
    .select()
    .from(schema.plots)
    .where(eq(schema.plots.id, id))
  if (!existing) return c.json({ error: "Unknown plot" }, 404)

  const size = str(body.size) || existing.size
  let price = existing.price
  if (body.price !== undefined) {
    price = Number(body.price)
    if (!Number.isFinite(price) || price < 0) {
      return c.json({ error: "Price must be a positive amount" }, 400)
    }
    price = Math.round(price)
  }

  // Location (cemetery/section/row/column) stays fixed: the plot id and number
  // are derived from it, so editing them would orphan existing reservations.
  const [updated] = await db
    .update(schema.plots)
    .set({
      size,
      price,
      status: oneOf(body.status, PLOT_STATUSES, existing.status),
      type: oneOf(body.type, PLOT_CATEGORIES, existing.type),
      groupName:
        body.groupName === undefined
          ? existing.groupName
          : str(body.groupName) || null,
      reservedFor:
        body.reservedFor === undefined
          ? existing.reservedFor
          : str(body.reservedFor) || null,
    })
    .where(eq(schema.plots.id, id))
    .returning()
  return c.json(toPlot(updated))
})

routes.delete("/plots/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const [existing] = await db
    .select()
    .from(schema.plots)
    .where(eq(schema.plots.id, id))
  if (!existing) return c.json({ error: "Unknown plot" }, 404)
  if (existing.status === "Reserved" || existing.status === "Occupied") {
    return c.json(
      { error: `Plot is ${existing.status.toLowerCase()} — free it first` },
      409
    )
  }

  await db.delete(schema.plots).where(eq(schema.plots.id, id))
  return c.json({ ok: true })
})

routes.patch("/reservations/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json<Record<string, unknown>>()
  const [existing] = await db
    .select()
    .from(schema.reservations)
    .where(eq(schema.reservations.id, id))
  if (!existing) return c.json({ error: "Unknown reservation" }, 404)

  const [updated] = await db
    .update(schema.reservations)
    .set({
      date: isDate(str(body.date)) ? str(body.date) : existing.date,
      plotCategory: oneOf(
        body.plotCategory,
        PLOT_CATEGORIES,
        existing.plotCategory
      ),
      status: oneOf(body.status, RESERVATION_STATUSES, existing.status),
      verification: oneOf(
        body.verification,
        VERIFICATION_STATUSES,
        existing.verification
      ),
    })
    .where(eq(schema.reservations.id, id))
    .returning()
  return c.json(toReservation(updated))
})

routes.delete("/reservations/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const [existing] = await db
    .select()
    .from(schema.reservations)
    .where(eq(schema.reservations.id, id))
  if (!existing) return c.json({ error: "Unknown reservation" }, 404)

  await db.delete(schema.reservations).where(eq(schema.reservations.id, id))

  // Releasing the booking mirrors what creating it did in reverse: the plot
  // goes back on the market and the client's reservation count follows.
  let plot = null
  const [booked] = await db
    .select()
    .from(schema.plots)
    .where(
      and(
        eq(schema.plots.cemeteryId, existing.cemeteryId),
        eq(schema.plots.plotNumber, existing.plotNumber)
      )
    )
  if (booked && booked.reservedFor === existing.clientName) {
    ;[plot] = await db
      .update(schema.plots)
      .set({ status: "Available", reservedFor: null })
      .where(eq(schema.plots.id, booked.id))
      .returning()
  }
  let client = null
  const [owner] = await db
    .select()
    .from(schema.clients)
    .where(eq(schema.clients.fullName, existing.clientName))
  if (owner && owner.reservations > 0) {
    ;[client] = await db
      .update(schema.clients)
      .set({ reservations: owner.reservations - 1 })
      .where(eq(schema.clients.id, owner.id))
      .returning()
  }

  return c.json({
    ok: true,
    plot: plot ? toPlot(plot) : null,
    client,
  })
})

routes.patch("/payments/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json<Record<string, unknown>>()
  const [existing] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, id))
  if (!existing) return c.json({ error: "Unknown payment" }, 404)

  let amount = existing.amount
  if (body.amount !== undefined) {
    amount = Number(body.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return c.json({ error: "Amount must be greater than zero" }, 400)
    }
    amount = Math.round(amount)
  }

  const [updated] = await db
    .update(schema.payments)
    .set({
      type: oneOf(body.type, PAYMENT_TYPES, existing.type),
      amount,
      date: isDate(str(body.date)) ? str(body.date) : existing.date,
      status: oneOf(body.status, PAYMENT_STATUSES, existing.status),
      method: oneOf(body.method, PAYMENT_METHODS, existing.method),
    })
    .where(eq(schema.payments.id, id))
    .returning()
  return c.json(updated)
})

routes.delete("/payments/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const [existing] = await db
    .select()
    .from(schema.payments)
    .where(eq(schema.payments.id, id))
  if (!existing) return c.json({ error: "Unknown payment" }, 404)

  await db.delete(schema.payments).where(eq(schema.payments.id, id))
  return c.json({ ok: true })
})

routes.patch("/agreements/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json<Record<string, unknown>>()
  const [existing] = await db
    .select()
    .from(schema.agreements)
    .where(eq(schema.agreements.id, id))
  if (!existing) return c.json({ error: "Unknown agreement" }, 404)

  const [updated] = await db
    .update(schema.agreements)
    .set({
      type: oneOf(body.type, AGREEMENT_TYPES, existing.type),
      dateSigned: isDate(str(body.dateSigned))
        ? str(body.dateSigned)
        : existing.dateSigned,
      status: oneOf(body.status, AGREEMENT_STATUSES, existing.status),
    })
    .where(eq(schema.agreements.id, id))
    .returning()
  return c.json(updated)
})

routes.delete("/agreements/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const [existing] = await db
    .select()
    .from(schema.agreements)
    .where(eq(schema.agreements.id, id))
  if (!existing) return c.json({ error: "Unknown agreement" }, 404)

  await db.delete(schema.agreements).where(eq(schema.agreements.id, id))
  return c.json({ ok: true })
})

routes.patch("/reports/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json<Record<string, unknown>>()
  const [existing] = await db
    .select()
    .from(schema.generatedReports)
    .where(eq(schema.generatedReports.id, id))
  if (!existing) return c.json({ error: "Unknown report" }, 404)

  const [updated] = await db
    .update(schema.generatedReports)
    .set({
      name: str(body.name) || existing.name,
      type: str(body.type) || existing.type,
      status: oneOf(body.status, REPORT_STATUSES, existing.status),
    })
    .where(eq(schema.generatedReports.id, id))
    .returning()
  return c.json(updated)
})

routes.delete("/reports/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const [existing] = await db
    .select()
    .from(schema.generatedReports)
    .where(eq(schema.generatedReports.id, id))
  if (!existing) return c.json({ error: "Unknown report" }, 404)

  await db
    .delete(schema.generatedReports)
    .where(eq(schema.generatedReports.id, id))
  return c.json({ ok: true })
})

routes.patch("/notifications/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const body = await c.req.json<Record<string, unknown>>()
  const [existing] = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.id, id))
  if (!existing) return c.json({ error: "Unknown notification" }, 404)

  // Only the read flag is editable; the message is an event record.
  const [updated] = await db
    .update(schema.notifications)
    .set({
      read:
        typeof body.read === "boolean" ? body.read : existing.read,
    })
    .where(eq(schema.notifications.id, id))
    .returning()
  return c.json(updated)
})

routes.delete("/notifications/:id", staffGuard, async (c) => {
  const id = c.req.param("id")
  const [existing] = await db
    .select()
    .from(schema.notifications)
    .where(eq(schema.notifications.id, id))
  if (!existing) return c.json({ error: "Unknown notification" }, 404)

  await db
    .delete(schema.notifications)
    .where(eq(schema.notifications.id, id))
  return c.json({ ok: true })
})

/* --------------------------------- helpers --------------------------------- */

function toPlot(r: typeof schema.plots.$inferSelect) {
  return {
    id: r.id,
    plotNumber: r.plotNumber,
    cemeteryId: r.cemeteryId,
    section: r.section,
    row: r.row,
    column: r.column,
    size: r.size,
    price: r.price,
    status: r.status,
    type: normalizePlotType(r.type),
    groupName: r.groupName ?? undefined,
    reservedFor: r.reservedFor ?? undefined,
  }
}

function normalizePlotType(type: string) {
  switch (type) {
    case "Typical Plot":
    case "Public":
      return "Typical Block"
    case "Premium Block":
    case "Private":
      return "Premium Lot"
    case "Special Premium Plot":
    case "Vertical":
      return "Special Premium Lot"
    default:
      return type
  }
}

function toReservation(r: typeof schema.reservations.$inferSelect) {
  return {
    id: r.id,
    reservationNumber: r.reservationNumber,
    clientName: r.clientName,
    cemeteryId: r.cemeteryId,
    plotNumber: r.plotNumber,
    date: r.date,
    plotCategory: r.plotCategory,
    status: r.status,
    verification: r.verification,
  }
}

export default routes
