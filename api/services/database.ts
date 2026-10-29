import { attachDatabasePool } from "@neon/functions"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

/**
 * Shared server-side connection to the branch's Neon Postgres database.
 * Route services use Drizzle for queries and the pool for raw SQL.
 */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
attachDatabasePool(pool)

export const db = drizzle(pool)
