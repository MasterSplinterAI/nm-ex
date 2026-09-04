import type { ReactNode } from "react";

export type FieldRow = { label: string; value: ReactNode; strong?: boolean; tone?: "red" | "green" };

export function FieldList({ rows, dense = false }: { rows: FieldRow[]; dense?: boolean }) {
  return (
    <dl className={`divide-y divide-[var(--line)] ${dense ? "text-xs" : "text-sm"}`}>
      {rows.map((row) => (
        <div key={row.label} className={`grid grid-cols-[minmax(0,11rem)_1fr] gap-3 ${dense ? "py-1.5" : "py-2"}`}>
          <dt className="text-[var(--ink-muted)]">{row.label}</dt>
          <dd
            className={`min-w-0 break-words text-[var(--ink)] ${row.strong ? "font-semibold" : ""} ${
              row.tone === "red" ? "text-[#9b2c2c] font-semibold" : row.tone === "green" ? "text-[var(--forest)] font-semibold" : ""
            }`}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
