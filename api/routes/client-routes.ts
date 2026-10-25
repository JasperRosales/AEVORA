import { randomUUID } from "node:crypto"
import { Hono, type Context } from "hono"
import { authGuard, clientRowFor, type AppEnv, type Caller } from "../lib/auth"
import { pool } from "../lib/db"
import { isDate, nextCode, oneOf, str, today } from "../lib/records"
import { signDownloadUrl } from "../lib/storage"

/**
 * Client portal — everything a client-role user may see or do, scoped
 * server-side by matching their auth email to their row in the `clients`
 * table. A client can never see another family's records, and the purchase
 * routes never accept a client id from the browser: the owner is always the
 * signed-in caller. The filtering happens here, not in the UI.
 */
const routes = new Hono<AppEnv>()
// Path-scoped (not "*") so it can't leak onto sibling routes when mounted.
routes.use("/client/*", authGuard)

const BURIAL_TYPES = ["Private", "Vertical", "Public"] as const
const PAYMENT_TYPES = [
  "Reservation Fee",
  "Down Payment",
  "Installment",
  "Full Payment",
] as const
const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "Online"] as const

interface ReservationRow {
  id: string
  reservation_number: string
  plot_number: string
  date: string
  burial_type: string
  status: string
  verification: string
  cemetery: string
  location: string
  price: number
}

interface PlotRow {
  id: string
  plot_number: string
  cemetery_id: string
  section: string
  row: number
  column: number
  type: string
  size: string
  price: number
  status: string
  cemetery: string
  location: string
}

interface AttachmentRow {
  id: string
  filename: string
  content_type: string
  size: number
  created_at: string
  key: string
}

async function clientScope(c: Context<AppEnv>) {
  const caller: Caller = c.get("caller")
  const client = await clientRowFor(caller.email)
  if (!client) return { caller, client: null, name: null as string | null }
  return { caller, client, name: String(client.full_name) }
}

routes.get("/client/summary", async (c) => {
  const { caller, client, name } = await clientScope(c)
  if (!client)
    return c.json({
      client: null,
      reservations: 0,
      payments: 0,
      nextReservation: null,
    })
  const [res, pay] = await Promise.all([
    pool.query(
      "select count(*)::int n from reservations where client_name = $1",
      [name]
    ),
    pool.query(
      "select coalesce(sum(amount), 0)::int n, count(*)::int c from payments where client_name = $1 and status = 'Paid'",
      [name]
    ),
  ])
  const next = await pool.query(
    `select reservation_number, plot_number, date, burial_type, status, verification
     from reservations where client_name = $1 and status <> 'Cancelled'
     order by date asc limit 1`,
    [name]
  )
  return c.json({
    client,
    profile: { name: caller.name, email: caller.email },
    reservations: res.rows[0].n,
    totalPaid: pay.rows[0].n,
    paymentCount: pay.rows[0].c,
    nextReservation: next.rows[0] ?? null,
  })
})

/* ------------------------------ buying a plot ------------------------------ */

/**
 * The plot catalogue for the portal. The default is the buying list — Available
 * plots only — so older portal builds keep working unchanged. The visual map
 * asks for `?scope=all` to draw every status in its real position. Owner details
 * (`reserved_for`) are deliberately never selected: status is public, whose
 * family holds a plot is not. Reserving is still rejected server-side unless the
 * plot is Available.
 */
routes.get("/client/plots", async (c) => {
  const { client } = await clientScope(c)
  if (!client) return c.json([])
  const all = c.req.query("scope") === "all"
  const rows = await pool.query<PlotRow>(
    `select p.id, p.plot_number, p.cemetery_id, p.section, p.row, p.column,
            p.type, p.size, p.price, p.status,
            ce.name as cemetery, ce.location
     from plots p join cemeteries ce on ce.id = p.cemetery_id
     where ($1::boolean or p.status = 'Available')
     order by ce.name, p.section, p.row, p.column`,
    [all]
  )
  return c.json(rows.rows)
})

/**
 * Self-service booking. Picking a plot holds it immediately: the reservation
 * is created as Pending / Waiting for Checking, the plot becomes Reserved for
 * this family, and the client's reservation count follows — the same state the
 * staff quick action produces, minus the ability to choose whose name goes on
 * it. The transaction plus `for update` keeps two families from booking the
 * same plot at the same moment.
 */
routes.post("/client/reservations", async (c) => {
  const { client, name } = await clientScope(c)
  if (!client) {
    return c.json(
      { error: "Your account is not linked to a client record yet." },
      403
    )
  }
  const body = await c.req.json<Record<string, unknown>>()
  const plotId = str(body.plotId)
  if (!plotId) return c.json({ error: "Please choose a plot first." }, 400)

  const conn = await pool.connect()
  try {
    await conn.query("begin")
    const selected = await conn.query<PlotRow>(
      `select p.id, p.plot_number, p.cemetery_id, p.section, p.row, p.column,
              p.type, p.size, p.price, p.status,
              ce.name as cemetery, ce.location
       from plots p join cemeteries ce on ce.id = p.cemetery_id
       where p.id = $1
       for update of p`,
      [plotId]
    )
    const plot = selected.rows[0]
    if (!plot) {
      await conn.query("rollback")
      return c.json({ error: "That plot no longer exists." }, 404)
    }
    if (plot.status !== "Available") {
      await conn.query("rollback")
      return c.json(
        {
          error: `Plot ${plot.plot_number} is ${plot.status.toLowerCase()} and can no longer be reserved.`,
        },
        409
      )
    }

    const existing = await conn.query<{ reservation_number: string }>(
      "select reservation_number from reservations"
    )
    const date = isDate(str(body.date)) ? str(body.date) : today()
    const burialType = oneOf(
      body.burialType,
      BURIAL_TYPES,
      oneOf(plot.type, BURIAL_TYPES, "Private")
    )

    const created = await conn.query(
      `insert into reservations
         (id, reservation_number, client_name, cemetery_id, plot_number, date, burial_type, status, verification)
       values ($1, $2, $3, $4, $5, $6, $7, 'Pending', 'Waiting for Checking')
       returning id, reservation_number, plot_number, date, burial_type, status, verification`,
      [
        randomUUID(),
        nextCode(
          existing.rows.map((r) => r.reservation_number),
          "R-",
          3
        ),
        name,
        plot.cemetery_id,
        plot.plot_number,
        date,
        burialType,
      ]
    )
    await conn.query(
      "update plots set status = 'Reserved', reserved_for = $1 where id = $2",
      [name, plot.id]
    )
    await conn.query(
      "update clients set reservations = reservations + 1 where id = $1",
      [client.id]
    )
    await conn.query("commit")

    return c.json(
      {
        ...created.rows[0],
        cemetery: plot.cemetery,
        location: plot.location,
        price: plot.price,
        files: [],
      },
      201
    )
  } catch (err) {
    await conn.query("rollback").catch(() => {})
    throw err
  } finally {
    conn.release()
  }
})

/**
 * A payment submitted from the portal. It is recorded against one of the
 * caller's own reservations and lands as Pending — the office confirms the
 * money arrived before the ledger counts it as Paid. The plot and cemetery are
 * copied from the reservation, never trusted from the browser.
 */
routes.post("/client/payments", async (c) => {
  const { client, name } = await clientScope(c)
  if (!client) {
    return c.json(
      { error: "Your account is not linked to a client record yet." },
      403
    )
  }
  const body = await c.req.json<Record<string, unknown>>()
  const reservationId = str(body.reservationId)
  const amount = Number(body.amount)
  if (!reservationId) {
    return c.json({ error: "Choose the reservation this payment is for." }, 400)
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return c.json({ error: "Enter an amount greater than zero." }, 400)
  }

  const target = await pool.query<{
    plot_number: string
    cemetery_id: string
    cemetery: string
    price: number
    committed: number
  }>(
    `select r.plot_number, r.cemetery_id, ce.name as cemetery,
            coalesce(
              pl.price,
              (select p2.price from plots p2
               where p2.cemetery_id = r.cemetery_id and p2.type = r.burial_type
               order by p2.price limit 1),
              0
            ) as price,
            coalesce((
              select sum(pay.amount) from payments pay
              where pay.client_name = r.client_name
                and pay.plot_number = r.plot_number
                and pay.cemetery_id = r.cemetery_id
                and pay.status <> 'Overdue'
            ), 0)::int as committed
     from reservations r join cemeteries ce on ce.id = r.cemetery_id
     left join plots pl on pl.cemetery_id = r.cemetery_id and pl.plot_number = r.plot_number
     where r.id = $1 and r.client_name = $2 and r.status <> 'Cancelled'`,
    [reservationId, name]
  )
  const reservation = target.rows[0]
  if (!reservation) {
    return c.json({ error: "That reservation is not on your account." }, 404)
  }

  // Pending submissions count as committed, exactly like the portal's balance
  // display, so a family can't accidentally pay the same share twice.
  const remaining = Math.max(
    0,
    Number(reservation.price) - Number(reservation.committed)
  )
  if (remaining === 0) {
    return c.json({ error: "This plot is already fully settled." }, 409)
  }
  if (Math.round(amount) > remaining) {
    return c.json(
      {
        error: `The remaining balance is ₱${remaining.toLocaleString("en-PH")}.`,
      },
      400
    )
  }

  const existing = await pool.query<{ receipt_number: string }>(
    "select receipt_number from payments"
  )
  const inserted = await pool.query(
    `insert into payments
       (id, receipt_number, client_name, plot_number, type, amount, date, status, method, cemetery_id)
     values ($1, $2, $3, $4, $5, $6, $7, 'Pending', $8, $9)
     returning receipt_number, plot_number, type, amount, date, status, method`,
    [
      randomUUID(),
      nextCode(
        existing.rows.map((r) => r.receipt_number),
        "OR-",
        2
      ),
      name,
      reservation.plot_number,
      oneOf(body.type, PAYMENT_TYPES, "Reservation Fee"),
      Math.round(amount),
      isDate(str(body.date)) ? str(body.date) : today(),
      oneOf(body.method, PAYMENT_METHODS, "Online"),
      reservation.cemetery_id,
    ]
  )

  return c.json({ ...inserted.rows[0], cemetery: reservation.cemetery }, 201)
})

/* -------------------------------- history --------------------------------- */

routes.get("/client/reservations", async (c) => {
  const { client, name } = await clientScope(c)
  if (!client) return c.json([])
  // The plot price rides along so the portal can show what is still owed
  // without a second request (and without exposing the staff plot register).
  // Older reservations can reference a plot number that is no longer in the
  // register; for those, fall back to the current price of the same burial
  // type in that cemetery.
  const rows = await pool.query<ReservationRow>(
    `select r.id, r.reservation_number, r.plot_number, r.date, r.burial_type, r.status, r.verification,
            ce.name as cemetery, ce.location,
            coalesce(
              pl.price,
              (select p2.price from plots p2
               where p2.cemetery_id = r.cemetery_id and p2.type = r.burial_type
               order by p2.price limit 1),
              0
            ) as price
     from reservations r
     join cemeteries ce on ce.id = r.cemetery_id
     left join plots pl on pl.cemetery_id = r.cemetery_id and pl.plot_number = r.plot_number
     where r.client_name = $1 order by r.date desc`,
    [name]
  )
  const withFiles = await Promise.all(
    rows.rows.map(async (r) => {
      const files = await pool.query<AttachmentRow>(
        "select id, filename, content_type, size, created_at, key from attachments where reservation_id = $1 order by created_at",
        [r.id]
      )
      const signed = await Promise.all(
        files.rows.map(async (f) => ({
          id: f.id,
          filename: f.filename,
          content_type: f.content_type,
          size: f.size,
          created_at: f.created_at,
          url: await signDownloadUrl(f.key),
        }))
      )
      return { ...r, files: signed }
    })
  )
  return c.json(withFiles)
})

routes.get("/client/payments", async (c) => {
  const { client, name } = await clientScope(c)
  if (!client) return c.json([])
  const rows = await pool.query(
    `select p.receipt_number, p.plot_number, p.type, p.amount, p.date, p.status, p.method,
            ce.name as cemetery
     from payments p join cemeteries ce on ce.id = p.cemetery_id
     where p.client_name = $1 order by p.date desc`,
    [name]
  )
  return c.json(rows.rows)
})

routes.get("/client/agreements", async (c) => {
  const { client, name } = await clientScope(c)
  if (!client) return c.json([])
  const rows = await pool.query(
    `select a.agreement_number, a.plot_number, a.type, a.date_signed, a.status, ce.name as cemetery
     from agreements a join cemeteries ce on ce.id = a.cemetery_id
     where a.client_name = $1 order by a.date_signed desc`,
    [name]
  )
  return c.json(rows.rows)
})

export default routes
