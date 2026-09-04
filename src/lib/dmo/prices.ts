import type { SpotBoard } from "@/lib/types";
import { WorkflowError, type PriceRef } from "./types";

export function priceRefFromBoard(board: SpotBoard, atIso: string): PriceRef {
  const tin = board.minerals.find((m) => m.slug === "tin");
  if (tin?.lastUsd == null) {
    throw new WorkflowError("No LME tin reference on the board.");
  }
  return { lmeUsd: tin.lastUsd, fxRate: board.fx.rate, at: atIso };
}
