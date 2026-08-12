/**
 * Port of ERP ExchangeRateService (xe.com), adapted USD → NGN.
 * Prefer embedded JSON rates; fall back to HTML conversion text.
 */

const NGN_MIN = 200;
const NGN_MAX = 3000;

function validNgn(rate: number): boolean {
  return rate >= NGN_MIN && rate <= NGN_MAX;
}

function extractFromJson(html: string): number | null {
  let best: { rate: number; timestamp: number } | null = null;

  const initial = html.match(
    /"initialRatesData"[\s\S]*?"timestamp"\s*:\s*(\d+)[\s\S]*?"rates"[\s\S]*?"NGN"\s*:\s*([\d.]+)/,
  );
  if (initial) {
    const rate = Number.parseFloat(initial[2]);
    const timestamp = Number.parseInt(initial[1], 10);
    if (validNgn(rate)) best = { rate, timestamp };
  }

  const manifests = [
    ...html.matchAll(
      /"timestamp"\s*:\s*(\d+)[^}]*?"rates"\s*:\s*\{[^}]*"NGN"\s*:\s*([\d.]+)/g,
    ),
  ];
  for (const match of manifests) {
    const timestamp = Number.parseInt(match[1], 10);
    const rate = Number.parseFloat(match[2]);
    if (validNgn(rate) && (!best || timestamp > best.timestamp)) {
      best = { rate, timestamp };
    }
  }

  if (best) return best.rate;

  const loose = [...html.matchAll(/"NGN"\s*:\s*([\d.]+)/g)]
    .map((m) => Number.parseFloat(m[1]))
    .filter(validNgn);
  if (loose.length) return Math.max(...loose);

  return null;
}

function extractFromHtml(html: string): number | null {
  const span = html.match(
    /1\.?00?\s+USD\s*=\s*([\d,]{3,}\.?\d*)(?:<[^>]*>(\d+)<\/[^>]*>)?\s*NGN/i,
  );
  if (span) {
    const main = span[1].replace(/,/g, "");
    const frac = span[2] ?? "";
    const rate = Number.parseFloat(`${main}${frac}`);
    if (validNgn(rate)) return rate;
  }

  const plain = html.match(
    /1\.?00?\s+USD\s*=\s*([\d,]+\.?\d*)\s*Nigerian\s*Naira/i,
  );
  if (plain) {
    const rate = Number.parseFloat(plain[1].replace(/,/g, ""));
    if (validNgn(rate)) return rate;
  }

  return null;
}

export async function scrapeUsdNgn(): Promise<number | null> {
  const url =
    "https://www.xe.com/currencyconverter/convert/?Amount=1&From=USD&To=NGN";

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
    throw new Error(`xe.com HTTP ${response.status}`);
  }

  const html = await response.text();
  return extractFromJson(html) ?? extractFromHtml(html);
}
