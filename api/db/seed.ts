/**
 * Creates the AEVORA schema in the linked Neon branch's Postgres and seeds a
 * fresh branch with the starter dataset (api/db/seed-data). The application
 * itself is database-only — this script is the one-time loader.
 *
 * Usage: npx tsx api/db/seed.ts   (reads DATABASE_URL from .env / .env.local)
 */
import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "./schema"
import { DDL } from "./ddl"
import { loadDotenv } from "./load-env"
import {
  activities,
  agreements,
  cemeteries,
  clients,
  generatedReports,
  notifications,
  payments,
  plots,
  reservations,
} from "./seed-data"

async function main() {
  const env = { ...loadDotenv(), ...process.env }
  // Migrations/DDL should use the direct (unpooled) connection.
  const connectionString = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL
  if (!connectionString) {
    throw new Error("No DATABASE_URL found — run `neon env pull` first.")
  }
  const pool = new Pool({ connectionString, max: 2 })
  const db = drizzle(pool)

  console.log("Applying schema...")
  await pool.query(DDL)

  console.log("Seeding cemeteries...")
  for (const c of cemeteries) {
    await db
      .insert(schema.cemeteries)
      .values(c)
      .onConflictDoUpdate({ target: schema.cemeteries.id, set: c })
  }

  console.log(`Seeding ${plots.length} plots...`)
  for (const p of plots) {
    const values = { ...p, reservedFor: p.reservedFor ?? null }
    await db
      .insert(schema.plots)
      .values(values)
      .onConflictDoUpdate({
        target: schema.plots.id,
        set: values,
      })
  }

  console.log(`Seeding ${reservations.length} reservations...`)
  for (const r of reservations) {
    await db
      .insert(schema.reservations)
      .values(r)
      .onConflictDoUpdate({ target: schema.reservations.id, set: r })
  }

  console.log(`Seeding ${clients.length} clients...`)
  for (const c of clients) {
    await db
      .insert(schema.clients)
      .values(c)
      .onConflictDoUpdate({ target: schema.clients.id, set: c })
  }

  console.log(`Seeding ${payments.length} payments...`)
  for (const p of payments) {
    await db
      .insert(schema.payments)
      .values(p)
      .onConflictDoUpdate({ target: schema.payments.id, set: p })
  }

  console.log(`Seeding ${agreements.length} agreements...`)
  for (const a of agreements) {
    await db
      .insert(schema.agreements)
      .values(a)
      .onConflictDoUpdate({ target: schema.agreements.id, set: a })
  }

  console.log(`Seeding ${activities.length} activities...`)
  for (const a of activities) {
    await db
      .insert(schema.activities)
      .values(a)
      .onConflictDoUpdate({ target: schema.activities.id, set: a })
  }

  console.log(`Seeding ${notifications.length} notifications...`)
  for (const n of notifications) {
    await db
      .insert(schema.notifications)
      .values(n)
      .onConflictDoUpdate({ target: schema.notifications.id, set: n })
  }

  console.log(`Seeding ${generatedReports.length} generated reports...`)
  for (const r of generatedReports) {
    await db
      .insert(schema.generatedReports)
      .values(r)
      .onConflictDoUpdate({ target: schema.generatedReports.id, set: r })
  }

  const { rows } = await pool.query(
    `select (select count(*) from cemeteries) cemeteries,
            (select count(*) from plots) plots,
            (select count(*) from reservations) reservations,
            (select count(*) from clients) clients,
            (select count(*) from payments) payments,
            (select count(*) from agreements) agreements,
            (select count(*) from activities) activities,
            (select count(*) from notifications) notifications,
            (select count(*) from generated_reports) generated_reports`
  )
  console.log("Row counts:", rows[0])
  await pool.end()
  console.log("Seed complete.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
