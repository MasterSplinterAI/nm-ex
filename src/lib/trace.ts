import { concentrateProcurementUsd } from "./policy";

export const VAT_PCT = 7.5;
export const SMELT_RECOVERY_PCT = 97;

/** Reported concentrate leaving Nigeria for China. */
export const EXPORTS_2023_T_MO = 200;
export const EXPORTS_NOW_T_MO = 1000;
export const EXPORTS_PROJECT_MIN = 1000;
export const EXPORTS_PROJECT_MAX = 2500;
export const EXPORTS_PROJECT_DEFAULT = 1600;

export const DEMO_LOT_ID = "NX-TIN-014";
export const DEMO_LOT_T = 10;

export type TracePrices = {
  lmeUsd: number;
  fxRate: number;
  benchmarkPct: number;
  royaltyPct: number;
  assayPct: number;
};

export type LotStatus =
  | "at_shed"
  | "at_buyer"
  | "at_refiner"
  | "refined"
  | "diverted";

export type CustodyEvent = {
  id: string;
  at: string;
  place: string;
  actor: string;
  action: string;
  tonnes: number;
  assayPct: number | null;
  doc: string | null;
  vatUsd: number;
  royaltyUsd: number;
};

export type TraceLot = {
  id: string;
  status: LotStatus;
  origin: string;
  shed: string;
  interactive: boolean;
  concentrateTonnes: number;
  assayPct: number;
  containedTonnes: number;
  refinedTonnes: number | null;
  royaltyUsd: number;
  vatUsd: number;
  exportAllowed: boolean;
  events: CustodyEvent[];
};

function money(value: number | null): number {
  return value == null || !Number.isFinite(value) ? 0 : value;
}

export function refinedTonnes(concentrateT: number, assayPct: number): number {
  return concentrateT * (assayPct / 100) * (SMELT_RECOVERY_PCT / 100);
}

export function royaltyOnRefinedUsd(
  concentrateT: number,
  assayPct: number,
  lmeUsd: number,
  royaltyPct: number,
): number {
  return refinedTonnes(concentrateT, assayPct) * lmeUsd * (royaltyPct / 100);
}

export function concentrateValueUsd(
  concentrateT: number,
  lmeUsd: number,
  benchmarkPct: number,
  assayPct: number,
): number {
  return (
    money(concentrateProcurementUsd(lmeUsd, benchmarkPct, assayPct)) *
    concentrateT
  );
}

export function vatOnTransferUsd(valueUsd: number): number {
  return valueUsd * (VAT_PCT / 100);
}

/**
 * Share of refined tin assumed sold to Nigerian end users. Exports are
 * zero-rated for VAT, so only in-country sales produce net VAT revenue.
 */
export const DOMESTIC_USE_DEFAULT_PCT = 15;

export function nationalTake(
  prices: TracePrices,
  concentrateTMo: number,
  domesticSharePct: number = DOMESTIC_USE_DEFAULT_PCT,
) {
  const refinedTMo = refinedTonnes(concentrateTMo, prices.assayPct);
  const monthlyRoyalty = royaltyOnRefinedUsd(
    concentrateTMo,
    prices.assayPct,
    prices.lmeUsd,
    prices.royaltyPct,
  );
  const monthlyValue = concentrateValueUsd(
    concentrateTMo,
    prices.lmeUsd,
    prices.benchmarkPct,
    prices.assayPct,
  );
  // Invoiced along the chain, but credited back against zero-rated exports.
  const monthlyChainVat = vatOnTransferUsd(monthlyValue);
  // Output VAT on refined tin sold to Nigerian end users — the VAT that sticks.
  const monthlyVat =
    refinedTMo * (domesticSharePct / 100) * prices.lmeUsd * (VAT_PCT / 100);
  return {
    concentrateTMo,
    refinedTMo,
    domesticSharePct,
    monthlyRoyalty,
    annualRoyalty: monthlyRoyalty * 12,
    monthlyVat,
    annualVat: monthlyVat * 12,
    monthlyChainVat,
    annualChainVat: monthlyChainVat * 12,
  };
}

export function statusLabel(status: LotStatus): string {
  switch (status) {
    case "at_shed":
      return "At shed";
    case "at_buyer":
      return "At buyer";
    case "at_refiner":
      return "At refiner";
    case "refined":
      return "Refined";
    case "diverted":
      return "Diverted";
  }
}

export type EntityRole = "shed" | "buyer" | "refiner";

export type TraceEntity = {
  /** Ministry registration number. */
  id: string;
  name: string;
  role: EntityRole;
  location: string;
  registeredSince: string;
};

/** Registered participants — the letter's tin sheds, aggregators, smelter. */
export const ENTITIES: TraceEntity[] = [
  {
    id: "MSD-SH-0098",
    name: "Jos Tin Shed",
    role: "shed",
    location: "Jos, Plateau",
    registeredSince: "2026-05-11",
  },
  {
    id: "MSD-SH-0142",
    name: "Wamba Tin Shed",
    role: "shed",
    location: "Wamba, Nasarawa",
    registeredSince: "2026-06-02",
  },
  {
    id: "MSD-SH-0187",
    name: "Akwanga Tin Shed",
    role: "shed",
    location: "Akwanga, Nasarawa",
    registeredSince: "2026-06-19",
  },
  {
    id: "MSD-SH-0201",
    name: "Keffi Tin Shed",
    role: "shed",
    location: "Keffi, Nasarawa",
    registeredSince: "2026-07-01",
  },
  {
    id: "MSD-SH-0224",
    name: "Lafia Tin Shed",
    role: "shed",
    location: "Lafia, Nasarawa",
    registeredSince: "2026-07-15",
  },
  {
    id: "MSD-BB-0031",
    name: "Jos Buying Centre",
    role: "buyer",
    location: "Jos, Plateau",
    registeredSince: "2026-05-11",
  },
  {
    id: "MSD-RF-0001",
    name: "United Smelters, Lagos",
    role: "refiner",
    location: "Lagos",
    registeredSince: "2026-04-28",
  },
];

export function roleLabel(role: EntityRole): string {
  switch (role) {
    case "shed":
      return "Tin shed";
    case "buyer":
      return "Bulk buyer";
    case "refiner":
      return "Refiner";
  }
}

export type EntityTransaction = {
  lotId: string;
  at: string;
  action: string;
  counterparty: string | null;
  direction: "in" | "out";
  tonnes: number;
  vatUsd: number;
  royaltyUsd: number;
  doc: string | null;
};

/**
 * Ledger for one registered participant, derived from lot custody events.
 * A payment recorded at the receiving entity also appears as an outgoing
 * sale at the entity the lot left.
 */
export function entityTransactions(
  lots: TraceLot[],
  entityName: string,
): EntityTransaction[] {
  const rows: EntityTransaction[] = [];
  for (const lot of lots) {
    lot.events.forEach((event, index) => {
      const prev = index > 0 ? lot.events[index - 1] : null;
      if (event.place === entityName) {
        rows.push({
          lotId: lot.id,
          at: event.at,
          action: event.action,
          counterparty:
            prev && prev.place !== entityName ? prev.place : null,
          direction: "in",
          tonnes: event.tonnes,
          vatUsd: event.vatUsd,
          royaltyUsd: event.royaltyUsd,
          doc: event.doc,
        });
      } else if (
        prev &&
        prev.place === entityName &&
        event.action.startsWith("Payment")
      ) {
        rows.push({
          lotId: lot.id,
          at: event.at,
          action: `Sold to ${event.place}`,
          counterparty: event.place,
          direction: "out",
          tonnes: event.tonnes,
          vatUsd: event.vatUsd,
          royaltyUsd: 0,
          doc: event.doc,
        });
      }
    });
  }
  rows.sort((a, b) => b.at.localeCompare(a.at));
  return rows;
}

export function buildMockLots(prices: TracePrices): TraceLot[] {
  const { assayPct, lmeUsd, benchmarkPct, royaltyPct } = prices;

  function lotBase(
    tonnes: number,
    events: CustodyEvent[],
    status: LotStatus,
    extra: Partial<TraceLot> & Pick<TraceLot, "id" | "origin" | "shed">,
  ): TraceLot {
    const contained = tonnes * (assayPct / 100);
    const refined =
      status === "refined" ? refinedTonnes(tonnes, assayPct) : null;
    const royalty =
      refined != null
        ? royaltyOnRefinedUsd(tonnes, assayPct, lmeUsd, royaltyPct)
        : 0;
    const vat = events.reduce((sum, event) => sum + event.vatUsd, 0);
    return {
      interactive: false,
      concentrateTonnes: tonnes,
      assayPct,
      containedTonnes: contained,
      refinedTonnes: refined,
      royaltyUsd: royalty,
      vatUsd: vat,
      exportAllowed: status === "refined",
      status,
      events,
      ...extra,
    };
  }

  const t10 = DEMO_LOT_T;
  const value10 = concentrateValueUsd(t10, lmeUsd, benchmarkPct, assayPct);
  const vat10 = vatOnTransferUsd(value10);
  const metal10 = refinedTonnes(t10, assayPct);
  const royalty10 = royaltyOnRefinedUsd(t10, assayPct, lmeUsd, royaltyPct);

  const t8 = 8;
  const value8 = concentrateValueUsd(t8, lmeUsd, benchmarkPct, assayPct);
  const vat8 = vatOnTransferUsd(value8);

  const t6 = 6;
  const value6 = concentrateValueUsd(t6, lmeUsd, benchmarkPct, assayPct);
  const vat6 = vatOnTransferUsd(value6);

  const t12 = 12;
  const t5 = 5;
  const value5 = concentrateValueUsd(t5, lmeUsd, benchmarkPct, assayPct);
  const vat5 = vatOnTransferUsd(value5);

  const t15 = 15;
  const value15 = concentrateValueUsd(t15, lmeUsd, benchmarkPct, assayPct);
  const vat15 = vatOnTransferUsd(value15);
  const metal15 = refinedTonnes(t15, assayPct);
  const royalty15 = royaltyOnRefinedUsd(t15, assayPct, lmeUsd, royaltyPct);

  const t9 = 9;
  const value9 = concentrateValueUsd(t9, lmeUsd, benchmarkPct, assayPct);
  const vat9 = vatOnTransferUsd(value9);

  return [
    lotBase(
      t10,
      [
        {
          id: "014-1",
          at: "2026-08-11T11:15:00+01:00",
          place: "Wamba Tin Shed",
          actor: "Shed intake",
          action: "Received (untraced mine)",
          tonnes: t10,
          assayPct,
          doc: "SH-8841",
          vatUsd: 0,
          royaltyUsd: 0,
        },
        {
          id: "014-2",
          at: "2026-08-13T07:50:00+01:00",
          place: "United Smelters, Lagos",
          actor: "Refiner",
          action: "Payment received",
          tonnes: t10,
          assayPct,
          doc: "NX-PAY-4412",
          vatUsd: vat10,
          royaltyUsd: 0,
        },
        {
          id: "014-3",
          at: "2026-08-14T16:20:00+01:00",
          place: "United Smelters, Lagos",
          actor: "Refiner",
          action: "Refined",
          tonnes: metal10,
          assayPct: 99.9,
          doc: "US-RF-441",
          vatUsd: 0,
          royaltyUsd: royalty10,
        },
      ],
      "refined",
      {
        id: DEMO_LOT_ID,
        origin: "Wamba, Nasarawa",
        shed: "Wamba Tin Shed",
        interactive: true,
      },
    ),
    lotBase(
      t8,
      [
        {
          id: "019-1",
          at: "2026-08-13T14:40:00+01:00",
          place: "Akwanga Tin Shed",
          actor: "Shed intake",
          action: "Received (untraced mine)",
          tonnes: t8,
          assayPct,
          doc: "SH-9012",
          vatUsd: 0,
          royaltyUsd: 0,
        },
        {
          id: "019-2",
          at: "2026-08-14T08:25:00+01:00",
          place: "Jos Buying Centre",
          actor: "Bulk buyer",
          action: "Payment received",
          tonnes: t8,
          assayPct,
          doc: "NX-PAY-2291",
          vatUsd: vat8,
          royaltyUsd: 0,
        },
      ],
      "at_buyer",
      {
        id: "NX-TIN-019",
        origin: "Akwanga, Nasarawa",
        shed: "Akwanga Tin Shed",
      },
    ),
    lotBase(
      t6,
      [
        {
          id: "022-1",
          at: "2026-08-12T10:00:00+01:00",
          place: "Keffi Tin Shed",
          actor: "Shed intake",
          action: "Received (untraced mine)",
          tonnes: t6,
          assayPct,
          doc: "SH-9104",
          vatUsd: 0,
          royaltyUsd: 0,
        },
        {
          id: "022-2",
          at: "2026-08-13T15:30:00+01:00",
          place: "United Smelters, Lagos",
          actor: "Refiner",
          action: "Payment received",
          tonnes: t6,
          assayPct,
          doc: "NX-PAY-3308",
          vatUsd: vat6,
          royaltyUsd: 0,
        },
      ],
      "at_refiner",
      {
        id: "NX-TIN-022",
        origin: "Keffi, Nasarawa",
        shed: "Keffi Tin Shed",
      },
    ),
    lotBase(
      t12,
      [
        {
          id: "021-1",
          at: "2026-08-10T12:00:00+01:00",
          place: "Wamba Tin Shed",
          actor: "Cash sale",
          action: "Left shed",
          tonnes: t12,
          assayPct,
          doc: null,
          vatUsd: 0,
          royaltyUsd: 0,
        },
        {
          id: "021-2",
          at: "2026-08-12T18:00:00+01:00",
          place: "Unknown buyer",
          actor: "Off book",
          action: "Last seen",
          tonnes: t12,
          assayPct,
          doc: null,
          vatUsd: 0,
          royaltyUsd: 0,
        },
      ],
      "diverted",
      {
        id: "NX-TIN-021",
        origin: "Wamba, Nasarawa",
        shed: "Wamba Tin Shed",
      },
    ),
    lotBase(
      t5,
      [
        {
          id: "025-1",
          at: "2026-08-14T09:10:00+01:00",
          place: "Lafia Tin Shed",
          actor: "Shed intake",
          action: "Received (untraced mine)",
          tonnes: t5,
          assayPct,
          doc: "SH-9220",
          vatUsd: 0,
          royaltyUsd: 0,
        },
      ],
      "at_shed",
      {
        id: "NX-TIN-025",
        origin: "Lafia, Nasarawa",
        shed: "Lafia Tin Shed",
      },
    ),
    lotBase(
      t15,
      [
        {
          id: "011-1",
          at: "2026-08-05T11:00:00+01:00",
          place: "Jos Tin Shed",
          actor: "Shed intake",
          action: "Received (untraced mine)",
          tonnes: t15,
          assayPct,
          doc: "SH-8710",
          vatUsd: 0,
          royaltyUsd: 0,
        },
        {
          id: "011-2",
          at: "2026-08-06T14:20:00+01:00",
          place: "Jos Buying Centre",
          actor: "Bulk buyer",
          action: "Payment received",
          tonnes: t15,
          assayPct,
          doc: "NX-PAY-1180",
          vatUsd: vat15,
          royaltyUsd: 0,
        },
        {
          id: "011-3",
          at: "2026-08-08T08:00:00+01:00",
          place: "United Smelters, Lagos",
          actor: "Refiner",
          action: "Payment received",
          tonnes: t15,
          assayPct,
          doc: "NX-PAY-1188",
          vatUsd: vat15,
          royaltyUsd: 0,
        },
        {
          id: "011-4",
          at: "2026-08-10T17:45:00+01:00",
          place: "United Smelters, Lagos",
          actor: "Refiner",
          action: "Refined",
          tonnes: metal15,
          assayPct: 99.9,
          doc: "US-RF-390",
          vatUsd: 0,
          royaltyUsd: royalty15,
        },
      ],
      "refined",
      {
        id: "NX-TIN-011",
        origin: "Jos, Plateau",
        shed: "Jos Tin Shed",
      },
    ),
    lotBase(
      t9,
      [
        {
          id: "028-1",
          at: "2026-08-13T16:00:00+01:00",
          place: "Wamba Tin Shed",
          actor: "Shed intake",
          action: "Received (untraced mine)",
          tonnes: t9,
          assayPct,
          doc: "SH-9301",
          vatUsd: 0,
          royaltyUsd: 0,
        },
        {
          id: "028-2",
          at: "2026-08-14T11:40:00+01:00",
          place: "Jos Buying Centre",
          actor: "Bulk buyer",
          action: "Payment received",
          tonnes: t9,
          assayPct,
          doc: "NX-PAY-4501",
          vatUsd: vat9,
          royaltyUsd: 0,
        },
      ],
      "at_buyer",
      {
        id: "NX-TIN-028",
        origin: "Wamba, Nasarawa",
        shed: "Wamba Tin Shed",
      },
    ),
  ];
}
