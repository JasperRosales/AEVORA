import { attachDatabasePool } from "@neon/functions"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

/**
 * The branch's Postgres connection, shared by every route module.
 * `attachDatabasePool` registers it with the Neon Functions runtime.
 */
export const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
attachDatabasePool(pool)

export const db = drizzle(pool)
