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

const ngnPrecise = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ngnRate = new Intl.NumberFormat("en-NG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 3,
});

export function formatUsd(value: number | null, precise = false): string {
  if (value == null || Number.isNaN(value)) return "—";
  return precise ? usdPrecise.format(value) : usd.format(value);
}

export function formatNgn(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return ngn.format(value);
}

/** Short naira for dashboard cards — ₦217m instead of a clipped ₦216,599,880. */
export function formatNgnCompact(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1_000_000_000) return `${sign}₦${(abs / 1_000_000_000).toFixed(2)}bn`;
  if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${sign}₦${(abs / 1_000).toFixed(0)}k`;
  return ngn.format(value);
}

export function formatNgnPrecise(value: number | null): string {
  if (value == null || Number.isNaN(value)) return "—";
  return ngnPrecise.format(value);
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

export function formatNumber(value: number | null, digits = 3): string {
  if (value == null || Number.isNaN(value)) return "—";
  return digits === 3 ? plain.format(value) : new Intl.NumberFormat("en-NG", { maximumFractionDigits: digits }).format(value);
}

export function formatMt(kg: number | null): string {
  if (kg == null || Number.isNaN(kg)) return "—";
  return `${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(kg / 1000)} MT`;
}

export function formatKg(kg: number | null): string {
  if (kg == null || Number.isNaN(kg)) return "—";
  return `${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 1 }).format(kg)} kg`;
}

export function formatAsOf(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

export function formatWelcomeStamp(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}
