export type Facility = {
  id: string;
  city: string;
  state: string;
  address: string;
  warehouse: string;
  image: string;
  services: string[];
  kmFromJos: number;
};

export const FACILITIES: Facility[] = [
  {
    id: "jos",
    city: "Jos",
    state: "Plateau State",
    address: "Rayfield Industrial Layout, Jos",
    warehouse: "NM-EX Approved Warehouse & Assay Centre — Jos",
    image: "/portal/warehouse-jos.jpg",
    services: ["Tin (Sn)", "Assay Lab", "Warehouse"],
    kmFromJos: 0,
  },
  {
    id: "abuja",
    city: "Abuja",
    state: "FCT",
    address: "Idu Industrial Area, Abuja",
    warehouse: "NM-EX Approved Warehouse & Assay Centre — Abuja",
    image: "/portal/warehouse-abuja.jpg",
    services: ["Tin (Sn)", "Assay Lab", "Warehouse"],
    kmFromJos: 185,
  },
  {
    id: "abakaliki",
    city: "Abakaliki",
    state: "Ebonyi State",
    address: "Onueke Road, Abakaliki",
    warehouse: "NM-EX Approved Warehouse & Assay Centre — Abakaliki",
    image: "/portal/warehouse-abakaliki.jpg",
    services: ["Tin (Sn)", "Assay Lab", "Warehouse"],
    kmFromJos: 420,
  },
  {
    id: "lagos",
    city: "Lagos",
    state: "Lagos State",
    address: "Apapa Industrial Estate, Lagos",
    warehouse: "NM-EX Approved Warehouse & Assay Centre — Lagos",
    image: "/portal/warehouse-lagos.jpg",
    services: ["Tin (Sn)", "Assay Lab", "Warehouse"],
    kmFromJos: 890,
  },
  {
    id: "uyo",
    city: "Uyo",
    state: "Akwa Ibom State",
    address: "Ikot Ekpene Road, Uyo",
    warehouse: "NM-EX Approved Warehouse & Assay Centre — Uyo",
    image: "/portal/warehouse-uyo.jpg",
    services: ["Tin (Sn)", "Assay Lab", "Warehouse"],
    kmFromJos: 680,
  },
  {
    id: "abeokuta",
    city: "Abeokuta",
    state: "Ogun State",
    address: "Lafenwa Industrial Layout, Abeokuta",
    warehouse: "NM-EX Approved Warehouse & Assay Centre — Abeokuta",
    image: "/portal/warehouse-abeokuta.jpg",
    services: ["Tin (Sn)", "Assay Lab", "Warehouse"],
    kmFromJos: 820,
  },
];

export const FACILITY_WAREHOUSES = FACILITIES.map((f) => f.warehouse);

export function facilityByWarehouse(name: string): Facility | undefined {
  return FACILITIES.find((f) => f.warehouse === name);
}

export function placeFromAddress(address: string): string {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return parts.slice(-3, -1).join(", ");
  return address;
}
