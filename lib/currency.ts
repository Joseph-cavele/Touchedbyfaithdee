/** Format a price in South African Rand, e.g. "R 1 250". */
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value)
}

/** Shown wherever a service has no confirmed price. Never "R 0". */
export const PRICE_ON_REQUEST = "Price on request"

/** A service's price for display: Rand when set, "Price on request" when not. */
export function formatPrice(value: number | null | undefined) {
  return typeof value === "number" && value > 0 ? formatCurrency(value) : PRICE_ON_REQUEST
}

/** True when a service has a confirmed price. */
export const hasPrice = (value: number | null | undefined): value is number =>
  typeof value === "number" && value > 0

/**
 * Total for a set of services. Unpriced services add nothing, and say so:
 * "R 270", "R 270 + price on request", or "Price on request" — never "R 0".
 */
export function formatTotal(prices: (number | null | undefined)[]) {
  const sum = prices.filter(hasPrice).reduce((a, b) => a + b, 0)
  const unpriced = prices.some((p) => !hasPrice(p))
  if (!unpriced) return formatCurrency(sum)
  return sum > 0 ? `${formatCurrency(sum)} + price on request` : PRICE_ON_REQUEST
}
