/**
 * Scrape SMM category price tables (Gold, Niobium–Tantalum, etc.).
 * Rows look like: LABEL</span></a><div>low-high</div><div>avg</div>
 */

export type ScrapedTablePrice = {
  last: number;
  low: number | null;
  high: number | null;
};

function parseMoney(raw: string): number {
  return Number.parseFloat(raw.replace(/,/g, ""));
}

function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractSmmTablePrice(
  html: string,
  label: string,
  minUsd: number,
  maxUsd: number,
): ScrapedTablePrice | null {
  const labelRe = escapeRegExp(label);
  const money = "([\\d,]+(?:\\.\\d+)?)";
  const re = new RegExp(
    `${labelRe}[\\s\\S]{0,120}?<div[^>]*>\\s*${money}\\s*-\\s*${money}\\s*<\\/div>\\s*<div[^>]*>\\s*${money}`,
    "i",
  );

  const match = html.match(re);
  if (!match) return null;

  const low = parseMoney(match[1]);
  const high = parseMoney(match[2]);
  const last = parseMoney(match[3]);

  if (!inRange(last, minUsd, maxUsd)) return null;

  return {
    last,
    low: inRange(low, minUsd, maxUsd) ? low : null,
    high: inRange(high, minUsd, maxUsd) ? high : null,
  };
}

export async function scrapeSmmTablePrice(
  url: string,
  label: string,
  minUsd: number,
  maxUsd: number,
): Promise<ScrapedTablePrice | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`SMM table HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();
  return extractSmmTablePrice(html, label, minUsd, maxUsd);
}
