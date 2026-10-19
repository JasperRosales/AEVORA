import { Hono, type Context } from "hono"
import { authGuard, clientRowFor, type AppEnv, type Caller } from "../lib/auth"
import { pool } from "../lib/db"
import { signDownloadUrl } from "../lib/storage"

/**
 * Client portal — everything a client-role user may see, scoped server-side
 * by matching their auth email to their row in the `clients` table. A client
 * can never see another family's records; the filtering happens here, not in
 * the UI.
 */
const routes = new Hono<AppEnv>()
// Path-scoped (not "*") so it can't leak onto sibling routes when mounted.
routes.use("/client/*", authGuard)

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
  if (!client) return c.json({ client: null, reservations: 0, payments: 0, nextReservation: null })
  const [res, pay] = await Promise.all([
    pool.query("select count(*)::int n from reservations where client_name = $1", [name]),
    pool.query(
      "select coalesce(sum(amount), 0)::int n, count(*)::int c from payments where client_name = $1 and status = 'Paid'",
      [name],
    ),
  ])
  const next = await pool.query(
    `select reservation_number, plot_number, date, burial_type, status, verification
     from reservations where client_name = $1 and status <> 'Cancelled'
     order by date asc limit 1`,
    [name],
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

routes.get("/client/reservations", async (c) => {
  const { client, name } = await clientScope(c)
  if (!client) return c.json([])
  const rows = await pool.query<ReservationRow>(
    `select r.id, r.reservation_number, r.plot_number, r.date, r.burial_type, r.status, r.verification,
            ce.name as cemetery, ce.location
     from reservations r join cemeteries ce on ce.id = r.cemetery_id
     where r.client_name = $1 order by r.date desc`,
    [name],
  )
  const withFiles = await Promise.all(
    rows.rows.map(async (r) => {
      const files = await pool.query<AttachmentRow>(
        "select id, filename, content_type, size, created_at, key from attachments where reservation_id = $1 order by created_at",
        [r.id],
      )
      const signed = await Promise.all(
        files.rows.map(async (f) => ({
          id: f.id,
          filename: f.filename,
          content_type: f.content_type,
          size: f.size,
          created_at: f.created_at,
          url: await signDownloadUrl(f.key),
        })),
      )
      return { ...r, files: signed }
    }),
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
    [name],
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
    [name],
  )
  return c.json(rows.rows)
})

export default routes
