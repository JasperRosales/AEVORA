/**
 * Small helpers shared by the write routes: request-body coercion, date
 * validation and the trailing-digit sequence codes used for record numbers
 * (CL-007, R-12, OR-03).
 */

/** Trimmed string out of an untyped request body ("" when absent). */
export function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

/** First allowed literal in `value`, otherwise `fallback`. */
export function oneOf<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

export function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Next number in codes like "CL-007" / "R-12" / "OR-03" (trailing digits). */
export function nextCode(
  values: string[],
  prefix: string,
  pad: number
): string {
  const max = values.reduce((top, value) => {
    const match = /(\d+)$/.exec(value)
    return match ? Math.max(top, Number(match[1])) : top
  }, 0)
  return `${prefix}${String(max + 1).padStart(pad, "0")}`
}
