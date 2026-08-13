import { MINERALS } from "./minerals";
import { scrapeMetalComLme } from "./scrapers/metal";
import { scrapeSmmTablePrice } from "./scrapers/smm-table";
import { scrapeUsdNgn } from "./scrapers/xe";
import { readSpotBoard, writeSpotBoard } from "./store";
import type { MineralQuote, SpotBoard } from "./types";

async function refreshMineral(
  previous: MineralQuote | undefined,
  def: (typeof MINERALS)[number],
): Promise<MineralQuote> {
  const base: MineralQuote = {
    slug: def.slug,
    name: def.name,
    symbol: def.symbol,
    unit: def.unit,
    spec: def.spec ?? previous?.spec ?? null,
    rank: def.rank,
    sourceUrl: def.sourceUrl,
    openUsd: previous?.openUsd ?? null,
    lastUsd: previous?.lastUsd ?? null,
    closeUsd: previous?.closeUsd ?? null,
    scrapedAt: previous?.scrapedAt ?? null,
    status: previous?.status ?? "pending",
  };

  try {
    if (def.scrapeKind === "metal-com-lme") {
      const scraped = await scrapeMetalComLme(
        def.sourceUrl,
        def.minUsd,
        def.maxUsd,
      );
      if (!scraped) {
        return { ...base, status: base.lastUsd != null ? "stale" : "pending" };
      }
      return {
        ...base,
        openUsd: scraped.open,
        lastUsd: scraped.last,
        closeUsd: scraped.close,
        scrapedAt: new Date().toISOString(),
        status: "live",
      };
    }

    if (def.scrapeKind === "smm-table" && def.tableLabel) {
      const scraped = await scrapeSmmTablePrice(
        def.sourceUrl,
        def.tableLabel,
        def.minUsd,
        def.maxUsd,
      );
      if (!scraped) {
        return { ...base, status: base.lastUsd != null ? "stale" : "pending" };
      }
      // Table feeds publish avg + range (not LME open/close).
      return {
        ...base,
        openUsd: scraped.low,
        lastUsd: scraped.last,
        closeUsd: scraped.high,
        scrapedAt: new Date().toISOString(),
        status: "live",
      };
    }

    return base;
  } catch (error) {
    console.error(`[refresh] ${def.slug} failed`, error);
    return { ...base, status: base.lastUsd != null ? "stale" : "pending" };
  }
}

export async function refreshSpotBoard(): Promise<SpotBoard> {
  const previous = await readSpotBoard();
  const now = new Date().toISOString();

  let fx = previous.fx;
  try {
    const rate = await scrapeUsdNgn();
    if (rate != null) {
      fx = {
        pair: "USD/NGN",
        rate: Number(rate.toFixed(4)),
        source: "xe.com",
        scrapedAt: now,
      };
    }
  } catch (error) {
    console.error("[refresh] USD/NGN failed", error);
  }

  const minerals: MineralQuote[] = [];
  for (const def of MINERALS) {
    const prior = previous.minerals.find((m) => m.slug === def.slug);
    minerals.push(await refreshMineral(prior, def));
  }

  const board: SpotBoard = {
    updatedAt: now,
    fx,
    minerals: minerals.sort((a, b) => a.rank - b.rank),
  };

  await writeSpotBoard(board);
  return board;
}
