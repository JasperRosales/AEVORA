/**
 * Creates the AEVORA schema in the linked Neon branch's Postgres and seeds a
 * fresh branch with the starter dataset (api/db/seed-data). The application
 * itself is database-only — this script is the one-time loader.
 *
 * Usage: npx tsx api/db/seed.ts   (reads DATABASE_URL from .env / .env.local)
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "./schema"
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

function loadDotenv(): Record<string, string> {
  const out: Record<string, string> = {}
  for (const file of [".env", ".env.local"]) {
    try {
      const text = readFileSync(resolve(process.cwd(), file), "utf8")
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
        if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "")
      }
    } catch {
      /* file absent — fine */
    }
  }
  return out
}

const DDL = `
create table if not exists cemeteries (
  id text primary key, name text not null, location text not null
);
create table if not exists plots (
  id text primary key, plot_number text not null,
  cemetery_id text not null references cemeteries(id),
  section text not null, "row" integer not null, "column" integer not null,
  type text not null, size text not null, price integer not null,
  status text not null, reserved_for text
);
create table if not exists reservations (
  id text primary key, reservation_number text not null, client_name text not null,
  cemetery_id text not null references cemeteries(id), plot_number text not null,
  date text not null, burial_type text not null, status text not null,
  verification text not null
);
create table if not exists clients (
  id text primary key, client_id text not null, full_name text not null,
  contact_number text not null, email text not null, type text not null,
  registered_at text not null, status text not null, reservations integer not null
);
create table if not exists payments (
  id text primary key, receipt_number text not null, client_name text not null,
  plot_number text not null, type text not null, amount integer not null,
  date text not null, status text not null, method text not null,
  cemetery_id text not null references cemeteries(id)
);
create table if not exists agreements (
  id text primary key, agreement_number text not null, client_name text not null,
  plot_number text not null, cemetery_id text not null references cemeteries(id),
  type text not null, date_signed text not null, status text not null
);
create table if not exists activities (
  id text primary key, action text not null, "user" text not null,
  date_time text not null, record text not null
);
create table if not exists notifications (
  id text primary key, message text not null, type text not null,
  date_time text not null, is_read boolean not null default false
);
alter table notifications add column if not exists is_read boolean not null default false;
create table if not exists generated_reports (
  id text primary key, name text not null, type text not null,
  date_generated text not null, generated_by text not null, status text not null
);
create table if not exists attachments (
  id text primary key,
  reservation_id text not null references reservations(id),
  key text not null, filename text not null, content_type text not null,
  size integer not null, created_at timestamptz not null default now()
);
`

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
    await db
      .insert(schema.plots)
      .values({ ...p, reservedFor: p.reservedFor ?? null })
      .onConflictDoUpdate({
        target: schema.plots.id,
        set: { ...p, reservedFor: p.reservedFor ?? null },
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
