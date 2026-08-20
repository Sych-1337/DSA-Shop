/** Money helpers — all amounts are integers in minor units (kopiyky for UAH). */

export type CurrencyCode = "UAH";

export function addMoney(...amounts: number[]): number {
  return amounts.reduce((sum, n) => {
    if (!Number.isInteger(n)) {
      throw new Error(`Non-integer money amount: ${n}`);
    }
    return sum + n;
  }, 0);
}

export function percentOf(amount: number, basisPoints: number): number {
  if (!Number.isInteger(amount) || !Number.isInteger(basisPoints)) {
    throw new Error("percentOf requires integer amount and basis points");
  }
  // basisPoints: 700 = 7.00%
  return Math.round((amount * basisPoints) / 10_000);
}

export function formatMoney(
  amount: number,
  currency: CurrencyCode = "UAH",
  locale = "uk-UA",
): string {
  if (!Number.isInteger(amount)) {
    throw new Error(`Non-integer money amount: ${amount}`);
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function toMinorUnits(major: number): number {
  return Math.round(major * 100);
}
