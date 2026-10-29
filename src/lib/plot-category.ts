import type { PlotCategory } from "@/types/domain"

export const PLOT_CATEGORIES: PlotCategory[] = [
  "Typical Block",
  "Premium Lot",
  "Special Premium Lot",
  "Lot with Trees",
]

export const plotCategoryStroke: Record<PlotCategory, string> = {
  "Typical Block": "#facc15",
  "Premium Lot": "#f97316",
  "Special Premium Lot": "#0000ff",
  "Lot with Trees": "#16a34a",
}
