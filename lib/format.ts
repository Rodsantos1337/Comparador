/**
 * Parse a price string in Portuguese/European format (e.g. "1,99 €", "1.99", "1 299,99")
 * into a number. Returns `null` when no valid amount is found.
 */
export function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;

  const cleaned = raw.trim().replace(/€/g, "").replace(/\s/g, "");
  const match = cleaned.match(/(\d+)(?:[.,](\d+))?/);
  if (!match) return null;

  const whole = Number(match[1]);
  const decimals = match[2] ? Number(match[2].padEnd(2, "0").slice(0, 2)) : 0;
  return Math.round((whole + decimals / 100) * 100) / 100;
}

/**
 * Extract the first percentage found in a string (e.g. "35%" from "Desconto 35%").
 * Returns `null` when none is present.
 */
export function parsePercent(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const match = raw.match(/(\d+\s*%)/);
  return match ? match[1].replace(/\s/g, "") : null;
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });
}
