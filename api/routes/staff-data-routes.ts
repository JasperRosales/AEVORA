import { Hono } from "hono"
import { staffGuard } from "../lib/auth"
import { db } from "../lib/db"
import * as schema from "../db/schema"

/**
 * Staff-only listing routes (admin/staff). Each route carries the guard
 * inline; row → domain shape mappers live here because only these
 * endpoints need them.
 */
const routes = new Hono()

routes.get("/cemeteries", staffGuard, async (c) => c.json(await db.select().from(schema.cemeteries)))

routes.get("/plots", staffGuard, async (c) => {
  const rows = await db.select().from(schema.plots)
  return c.json(rows.map(toPlot))
})

routes.get("/reservations", staffGuard, async (c) => {
  const rows = await db.select().from(schema.reservations)
  return c.json(rows.map(toReservation))
})

routes.get("/clients", staffGuard, async (c) => c.json(await db.select().from(schema.clients)))

routes.get("/payments", staffGuard, async (c) => c.json(await db.select().from(schema.payments)))

routes.get("/agreements", staffGuard, async (c) =>
  c.json(await db.select().from(schema.agreements)),
)

routes.get("/activities", staffGuard, async (c) =>
  c.json(await db.select().from(schema.activities)),
)

routes.get("/notifications", staffGuard, async (c) =>
  c.json(await db.select().from(schema.notifications)),
)

routes.get("/reports", staffGuard, async (c) =>
  c.json(await db.select().from(schema.generatedReports)),
)

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
