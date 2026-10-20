import { Hono } from "hono"
import { eq } from "drizzle-orm"
import { attachmentGuard, authGuard, ownsReservation, type AppEnv } from "../lib/auth"
import { db } from "../lib/db"
import { deleteObject, putObject, signDownloadUrl } from "../lib/storage"
import * as schema from "../db/schema"

/**
 * Object Storage: reservation attachments in the `assets` bucket, served to
 * the browser through short-lived presigned URLs.
 */
const routes = new Hono<AppEnv>()

// Registered separately (not inline) so handlers keep typed `:id` params.
routes.use("/reservations/:id/attachments", attachmentGuard)
routes.use("/attachments/:id", authGuard)

routes.get("/reservations/:id/attachments", async (c) => {
  const rows = await db
    .select()
    .from(schema.attachments)
    .where(eq(schema.attachments.reservationId, c.req.param("id")))
  const withUrls = await Promise.all(
    rows.map(async (row) => ({ ...row, url: await signDownloadUrl(row.key) })),
  )
  return c.json(withUrls)
})

routes.post("/reservations/:id/attachments", async (c) => {
  const reservationId = c.req.param("id")
  const [reservation] = await db
    .select()
    .from(schema.reservations)
    .where(eq(schema.reservations.id, reservationId))
  if (!reservation) return c.json({ error: "Unknown reservation" }, 404)

  const body = await c.req.parseBody()
  const file = body.file
  if (!(file instanceof File)) {
    return c.json({ error: 'Missing multipart field "file"' }, 400)
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "_")
  const key = `attachments/${reservationId}/${crypto.randomUUID()}-${safeName}`
  const contentType = file.type || "application/octet-stream"
  await putObject(key, Buffer.from(await file.arrayBuffer()), contentType)

  const [row] = await db
    .insert(schema.attachments)
    .values({
      id: crypto.randomUUID(),
      reservationId,
      key,
      filename: file.name,
      contentType,
      size: file.size,
    })
    .returning()

  return c.json({ ...row, url: await signDownloadUrl(key) }, 201)
})

routes.delete("/attachments/:id", async (c) => {
  const attachmentId = c.req.param("id")
  if (!attachmentId) return c.json({ error: "Missing attachment id" }, 400)
  const [row] = await db
    .select()
    .from(schema.attachments)
    .where(eq(schema.attachments.id, attachmentId))
  if (!row) return c.json({ error: "Unknown attachment" }, 404)
  // Clients may only delete files on their own reservations.
  const caller = c.get("caller")
  if (!(await ownsReservation(caller, row.reservationId))) {
    return c.json({ error: "Not your reservation" }, 403)
  }
  await deleteObject(row.key)
  // Drop the row too, or the deleted file would reappear in future listings
  // with a presigned URL pointing at a missing object.
  await db.delete(schema.attachments).where(eq(schema.attachments.id, row.id))
  return c.json({ ok: true })
})

export default routes
