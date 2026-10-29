import type { PlotCategory } from "@/types/domain"

export const PLOT_CATEGORIES: PlotCategory[] = [
  "Typical Block",
  "Premium Plot",
  "Special Premium Plot",
  "Lot with Trees",
]

export const plotCategoryStroke: Record<PlotCategory, string> = {
  "Typical Block": "#d4a017",
  "Premium Plot": "#d95f02",
  "Special Premium Plot": "#0000cc",
  "Lot with Trees": "#15803d",
}
