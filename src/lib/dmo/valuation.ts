import { round2 } from "./money";
import type { Valuation } from "./types";

export function containedTinMt(weightMt: number, gradePct: number): number {
  return weightMt * (gradePct / 100);
}

/** Weight × grade × LME × FX — the government reference value, unrounded. */
export function referenceValueNgn(
  weightMt: number,
  gradePct: number,
  lmeUsd: number,
  fxRate: number,
): number {
  return containedTinMt(weightMt, gradePct) * lmeUsd * fxRate;
}

export function recoveredTinMt(containedMt: number, recoveryPct: number): number {
  return containedMt * (recoveryPct / 100);
}

export type ClearanceInput = {
  weightMt: number;
  gradePct: number;
  lmeUsd: number;
  fxRate: number;
  royaltyPct: number;
  vatPct: number;
  liabilityHolderId: string;
};

/**
 * DMO-EC / DMO-ER. Royalty on the full contained-metal reference value.
 * The procurement coefficient is never applied here (handbook §8).
 * Export is zero-rated for VAT.
 */
export function valueExportClearance(input: ClearanceInput): Valuation {
  const reference = referenceValueNgn(
    input.weightMt,
    input.gradePct,
    input.lmeUsd,
    input.fxRate,
  );
  const royalty = round2(reference * (input.royaltyPct / 100));
  return {
    weightMt: input.weightMt,
    gradePct: input.gradePct,
    containedTinMt: containedTinMt(input.weightMt, input.gradePct),
    lmeUsd: input.lmeUsd,
    fxRate: input.fxRate,
    referenceValueNgn: round2(reference),
    procurementCoef: null,
    purchaseValueNgn: null,
    vatPct: input.vatPct,
    vatNgn: 0,
    totalPayableNgn: null,
    royaltyPct: input.royaltyPct,
    royaltyNgn: royalty,
    royaltyAtTransferNgn: royalty,
    royaltyLiabilityHolderId: input.liabilityHolderId,
  };
}

export type AcceptanceInput = {
  weightMt: number;
  gradePct: number;
  lmeUsd: number;
  fxRate: number;
  procurementCoef: number;
  royaltyPct: number;
  vatPct: number;
  smelterId: string;
};

/**
 * DMO-A. The seller is paid reference × coefficient plus VAT.
 * Royalty at transfer is ₦0; the liability moves to the acceptor immediately.
 */
export function valueAcceptance(input: AcceptanceInput): Valuation {
  const reference = referenceValueNgn(
    input.weightMt,
    input.gradePct,
    input.lmeUsd,
    input.fxRate,
  );
  const purchase = round2(reference * input.procurementCoef);
  const vat = round2(purchase * (input.vatPct / 100));
  return {
    weightMt: input.weightMt,
    gradePct: input.gradePct,
    containedTinMt: containedTinMt(input.weightMt, input.gradePct),
    lmeUsd: input.lmeUsd,
    fxRate: input.fxRate,
    referenceValueNgn: round2(reference),
    procurementCoef: input.procurementCoef,
    purchaseValueNgn: purchase,
    vatPct: input.vatPct,
    vatNgn: vat,
    totalPayableNgn: round2(purchase + vat),
    royaltyPct: input.royaltyPct,
    royaltyNgn: round2(reference * (input.royaltyPct / 100)),
    royaltyAtTransferNgn: 0,
    royaltyLiabilityHolderId: input.smelterId,
  };
}
