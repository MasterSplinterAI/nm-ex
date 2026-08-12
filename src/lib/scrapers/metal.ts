/**
 * Port of ERP LmePriceService metal.com scraping.
 * Source: www-old.metal.com LME 3M pages (Latest / Open / Prev.Close).
 */

export type ScrapedMetalPrices = {
  last: number;
  open: number | null;
  close: number | null;
};

function parseMoney(raw: string): number {
  return Number.parseFloat(raw.replace(/,/g, ""));
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

const MONEY = "([\\d,]+(?:\\.\\d+)?)";

export function extractPricesFromOldMetalCom(
  html: string,
  minUsd: number,
  maxUsd: number,
): ScrapedMetalPrices | null {
  const result: Partial<ScrapedMetalPrices> = {};

  const latest =
    html.match(new RegExp(`Latest\\s*:\\s*<\\/span>\\s*<span[^>]*>${MONEY}`, "i")) ??
    html.match(new RegExp(`strong___[^\\s>]*[^>]*>${MONEY}`));

  if (latest) {
    const price = parseMoney(latest[1]);
    if (inRange(price, minUsd, maxUsd)) result.last = price;
  }

  const open = html.match(new RegExp(`Open\\s*<\\/span>\\s*<span>${MONEY}`, "i"));
  if (open) {
    const price = parseMoney(open[1]);
    if (inRange(price, minUsd, maxUsd)) result.open = price;
  }

  const close = html.match(
    new RegExp(`Prev\\.?\\s*Close\\s*<\\/span>\\s*<span>${MONEY}`, "i"),
  );
  if (close) {
    const price = parseMoney(close[1]);
    if (inRange(price, minUsd, maxUsd)) result.close = price;
  }

  if (result.last == null) return null;
  return {
    last: result.last,
    open: result.open ?? null,
    close: result.close ?? null,
  };
}

export async function scrapeMetalComLme(
  url: string,
  minUsd: number,
  maxUsd: number,
): Promise<ScrapedMetalPrices | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(12_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`metal.com HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();
  return extractPricesFromOldMetalCom(html, minUsd, maxUsd);
}
