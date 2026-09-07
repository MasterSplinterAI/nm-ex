import type { ParticipantCategory } from "./types";

/**
 * A tin shed buys parcels from miners; a mine digs its own. Both use the same
 * ledger and the same lot machinery, so only the words change.
 */
export type SupplierVocab = {
  /** Sidebar label for the page. */
  ledgerNav: string;
  /** Page title. Recording is a first-class action here, not just a log. */
  ledgerTitle: string;
  /** Heading on the table of records within the page. */
  logTitle: string;
  ledgerLede: string;
  /** Heading on the form that adds a ledger line. */
  entryPanel: string;
  entryTitle: string;
  sourceLabel: string;
  sourcePlaceholder: string;
  /** Column header over the source of each parcel. */
  sourceColumn: string;
  costLabel: string;
  costColumn: string;
  addButton: string;
  emptyLedger: string;
  recordNoun: string;
  /** How this participant reaches the National Pool. */
  chainNote: string;
};

const TIN_SHED: SupplierVocab = {
  ledgerNav: "Purchases",
  ledgerTitle: "Purchases",
  logTitle: "Purchase logs",
  ledgerLede: "Every parcel bought from a miner, and which lot it was locked into.",
  entryPanel: "Record a purchase",
  entryTitle: "New purchase",
  sourceLabel: "Miner / cooperative / site",
  sourcePlaceholder: "e.g. Rayfield cooperative",
  sourceColumn: "Supplier / miner",
  costLabel: "Amount paid (₦)",
  costColumn: "Paid",
  addButton: "Add to ledger",
  emptyLedger: "No purchases recorded yet. Add one to start building a marketable lot.",
  recordNoun: "purchase",
  chainNote: "Buys from miners at the guaranteed floor, then sells the consolidated lot into the National Pool.",
};

const MINE: SupplierVocab = {
  ledgerNav: "Production",
  ledgerTitle: "Production",
  logTitle: "Production logs",
  ledgerLede: "Every tonne raised from your own pits, and which lot it was locked into.",
  entryPanel: "Record production",
  entryTitle: "New production run",
  sourceLabel: "Pit / section",
  sourcePlaceholder: "e.g. Ropp North pit",
  sourceColumn: "Pit / section",
  costLabel: "Production cost (₦)",
  costColumn: "Cost",
  addButton: "Add to ledger",
  emptyLedger: "No production recorded yet. Add a run to start building a marketable lot.",
  recordNoun: "production run",
  chainNote: "Sells its own verified production straight into the National Pool, taking the full smelter coefficient.",
};

export function supplierVocab(category: ParticipantCategory | null): SupplierVocab {
  return category === "mining_company" ? MINE : TIN_SHED;
}

export function isDirectMine(category: ParticipantCategory | null): boolean {
  return category === "mining_company";
}
