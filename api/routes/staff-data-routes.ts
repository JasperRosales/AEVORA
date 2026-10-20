import { randomUUID } from "node:crypto"
import { desc, eq } from "drizzle-orm"
import { Hono } from "hono"
import { staffGuard, type AppEnv } from "../lib/auth"
import { db } from "../lib/db"
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
const BURIAL_TYPES = ["Private", "Vertical", "Public"] as const
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

routes.get("/cemeteries", staffGuard, async (c) =>
  c.json(await db.select().from(schema.cemeteries))
)

routes.get("/plots", staffGuard, async (c) => {
  const rows = await db.select().from(schema.plots)
  return c.json(rows.map(toPlot))
})

routes.get("/reservations", staffGuard, async (c) => {
  const rows = await db.select().from(schema.reservations)
  return c.json(rows.map(toReservation))
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

routes.get("/notifications", staffGuard, async (c) =>
  c.json(await db.select().from(schema.notifications))
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

  return c.json(row, 201)
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
      type: oneOf(body.type, BURIAL_TYPES, "Private"),
      size,
      price: Math.round(price),
      status: oneOf(body.status, PLOT_STATUSES, "Available"),
      reservedFor: str(body.reservedFor) || null,
    })
    .returning()

  return c.json(toPlot(inserted), 201)
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
      burialType: oneOf(
        body.burialType,
        BURIAL_TYPES,
        oneOf(plot.type, BURIAL_TYPES, "Private")
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

/* --------------------------------- helpers --------------------------------- */

/** Trimmed string out of an untyped request body ("" when absent). */
function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

/** First allowed literal in `value`, otherwise `fallback`. */
function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Next number in codes like "CL-007" / "R-12" / "OR-03" (trailing digits). */
function nextCode(values: string[], prefix: string, pad: number): string {
  const max = values.reduce((top, value) => {
    const match = /(\d+)$/.exec(value)
    return match ? Math.max(top, Number(match[1])) : top
  }, 0)
  return `${prefix}${String(max + 1).padStart(pad, "0")}`
}

function toPlot(r: typeof schema.plots.$inferSelect) {
  return {
    id: r.id,
    plotNumber: r.plotNumber,
    cemeteryId: r.cemeteryId,
    section: r.section,
    row: r.row,
    column: r.column,
    type: r.type,
    size: r.size,
    price: r.price,
    status: r.status,
    reservedFor: r.reservedFor ?? undefined,
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
    burialType: r.burialType,
    status: r.status,
    verification: r.verification,
  }
}

export default routes
