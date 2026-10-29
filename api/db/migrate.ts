/**
 * Applies the idempotent AEVORA schema without touching any rows. Use this on
 * an existing branch after a schema change (for example the notifications
 * `is_read` column); use `api/db/seed.ts` to load the starter dataset.
 *
 * Usage: npx tsx api/db/migrate.ts   (reads DATABASE_URL from .env / .env.local)
 */
import { Pool } from "pg"
import { DDL } from "./ddl"
import { loadDotenv } from "./load-env"

async function main() {
  const env = { ...loadDotenv(), ...process.env }
  // Migrations/DDL should use the direct (unpooled) connection.
  const connectionString = env.DATABASE_URL_UNPOOLED ?? env.DATABASE_URL
  if (!connectionString) {
    throw new Error("No DATABASE_URL found — run `neon env pull` first.")
  }

  const pool = new Pool({ connectionString, max: 2 })
  try {
    console.log("Applying schema...")
    await pool.query(DDL)
    console.log("Schema is up to date.")
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
