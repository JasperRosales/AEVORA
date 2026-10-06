export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString("en-PH")}`
}

export function countByStatus(
  plots: { status: string }[],
): Record<string, number> {
  return plots.reduce<Record<string, number>>((acc, plot) => {
    acc[plot.status] = (acc[plot.status] ?? 0) + 1
    return acc
  }, {})
}
