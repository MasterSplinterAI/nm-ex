import type { ReactNode } from "react";

function Icon({ d, extra }: { d: string; extra?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      {extra && <path d={extra} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

const ICONS: Record<string, ReactNode> = {
  home: <Icon d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />,
  ledger: <Icon d="M8 6h11M8 12h11M8 18h11" extra="M5 6h.01M5 12h.01M5 18h.01" />,
  consolidate: <Icon d="M4 7h7v10H4zM13 7h7v5h-7zM13 14h7v3h-7z" />,
  lots: <Icon d="M4 7h16v12H4z" extra="M8 7V5h8v2M8 12h8" />,
  listing: <Icon d="M4 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" extra="M4 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />,
  certificates: <Icon d="M7 4h10v16H7z" extra="M10 9h4M10 13h4M12 17.5v.01" />,
  registrations: <Icon d="M8 7h11M8 12h11M8 17h7" extra="M5 7h.01M5 12h.01M5 17h.01" />,
  inspections: <Icon d="M10 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a6 6 0 0 1 12 0" extra="M17 17l3 3" />,
  offers: <Icon d="M4 7h16v4H4zM4 13h7v6H4zM13 13h7v6h-7z" />,
  settlements: <Icon d="M4 18V6h16v12z" extra="M8 10h8M8 14h5" />,
  reports: <Icon d="M4 19V5h12l4 4v10z" extra="M16 5v4h4M8 13h6M8 16h4" />,
  audit: <Icon d="M5 6h14M5 12h14M5 18h9" />,
  policy: <Icon d="M12 4 4 7v5c0 5 3.5 8 8 9 4.5-1 8-4 8-9V7l-8-3z" />,
  demo: <Icon d="M8 5h8l3 5-7 9-7-9 3-5z" />,
  pool: <Icon d="M4 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" extra="M4 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />,
  acceptances: <Icon d="M5 12l4 4 10-10" />,
  inventory: <Icon d="M4 8l8-4 8 4-8 4-8-4z" extra="M4 12l8 4 8-4M4 16l8 4 8-4" />,
  refined: <Icon d="M8 4h8l2 7H6L8 4zM7 11l-2 9h14l-2-9" />,
  purchases: <Icon d="M6 7h15l-1.5 9H8L6 7z" extra="M6 7 5 4H3M9 20h.01M17 20h.01" />,
  register: <Icon d="M7 4h10v16H7z" extra="M10 8h4M10 12h4" />,
  clearances: <Icon d="M5 12l4 4 10-10" />,
};

export function NavIcon({ id }: { id: string }) {
  return ICONS[id] ?? <Icon d="M5 12h14" />;
}
