import type {
  Plot,
  PlotCategory,
  PlotStatus,
} from "../../../src/types/domain"
import { cemeteries } from "./cemeteries"

const sections = ["A", "B", "C", "D"]
const ROWS = 4
const COLS = 6

const categories: PlotCategory[] = [
  "Typical Block",
  "Premium Lot",
  "Special Premium Lot",
  "Lot with Trees",
]
const lotSpecs: Record<PlotCategory, { size: string; price: number }> = {
  "Typical Block": { size: "1.2m x 1.0m", price: 15000 },
  "Premium Lot": { size: "2.4m x 1.2m", price: 85000 },
  "Special Premium Lot": { size: "2.4m x 1.2m", price: 120000 },
  "Lot with Trees": { size: "2.4m x 1.2m", price: 95000 },
}
const statuses: PlotStatus[] = [
  "Available",
  "Available",
  "Available",
  "Reserved",
  "Reserved",
  "Occupied",
  "Occupied",
  "Waiting for Checking",
  "Unavailable",
]

function pick<T>(list: T[], seed: number): T {
  return list[seed % list.length]
}

export const plots: Plot[] = cemeteries.flatMap((cemetery, ci) =>
  sections.flatMap((section, si) =>
    Array.from({ length: ROWS * COLS }, (_, i) => {
      const row = Math.floor(i / COLS) + 1
      const column = (i % COLS) + 1
      const seed = ci * 1000 + si * 100 + i
      const status = pick(statuses, seed + si * 3 + ci * 7)
      const type = pick(categories, seed + si * 2)
      return {
        id: `${cemetery.id}-${section}-${row}-${column}`,
        plotNumber: `${section}-${row}${String(column).padStart(2, "0")}`,
        cemeteryId: cemetery.id,
        section,
        row,
        column,
        size: lotSpecs[type].size,
        price: lotSpecs[type].price,
        status,
        type,
        reservedFor:
          status === "Reserved" || status === "Occupied"
            ? `Client ${String(seed % 20).padStart(2, "0")}`
            : undefined,
      }
    }),
  ),
)
