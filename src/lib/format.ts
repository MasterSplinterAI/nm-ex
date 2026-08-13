const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ngn = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const ngnRate = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatUsd(value: number | null, precise = false): string {
  if (value == null || Number.isNaN(value)) return "—";
  return precise ? usdPrecise.format(value) : usd.format(value);
}

export function formatNgn(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return ngn.format(value);
}

export function formatFxRate(rate: number): string {
  return `₦${ngnRate.format(rate)}`;
}

export function toNgn(usdValue: number | null, rate: number): number | null {
  if (usdValue == null) return null;
  return usdValue * rate;
}

export function formatPct(value: number, digits = 1): string {
  return `${Number.parseFloat(value.toFixed(digits))}%`;
}

export function formatAsOf(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}
