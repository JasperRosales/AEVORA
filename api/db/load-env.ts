import { readFileSync } from "node:fs"
import { resolve } from "node:path"

/** Minimal .env/.env.local reader for the standalone db scripts. */
export function loadDotenv(): Record<string, string> {
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
