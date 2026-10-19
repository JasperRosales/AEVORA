/**
 * AEVORA API — a Neon Function deployed on the `production` branch, next to
 * the branch's Postgres and Object Storage.
 *
 * - DATABASE_URL / AWS_* / NEON_AUTH_* are injected automatically by Neon.
 * - Requests are authenticated with a Neon Auth JWT (browser: authClient.token())
 *   verified against the branch's JWKS, or the ops API_KEY (scripts/tests).
 * - Route modules carry their own guards: staff-data (admin/staff),
 *   accounts (admin), client portal (scoped per user), attachments
 *   (ownership-checked for clients).
 */
import { Hono } from "hono"
import { cors } from "hono/cors"
import { authIssuer } from "./lib/auth"
import { pool } from "./lib/db"
import { BUCKET } from "./lib/storage"
import accountRoutes from "./routes/account-routes"
import attachmentRoutes from "./routes/attachment-routes"
import clientRoutes from "./routes/client-routes"
import staffDataRoutes from "./routes/staff-data-routes"

const app = new Hono()

app.use("/*", cors({ origin: "*" }))

// Liveness probe — intentionally unauthenticated.
app.get("/health", async (c) => {
  const { rows } = await pool.query(
    "select current_database() db, current_setting('server_version') version, current_user usr",
  )
  return c.json({
    ok: true,
    branch: process.env.NEON_BRANCH ?? null,
    database: rows[0],
    storageEndpoint: process.env.AWS_ENDPOINT_URL_S3 ?? null,
    bucket: BUCKET,
    auth: authIssuer,
  })
})

app.route("/", staffDataRoutes)
app.route("/", accountRoutes)
app.route("/", clientRoutes)
app.route("/", attachmentRoutes)

export default app
