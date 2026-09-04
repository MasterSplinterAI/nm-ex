"use client";

import Image from "next/image";
import { useState } from "react";
import type { Facility } from "@/lib/dmo/facilities";

export function FacilityPicker({
  facilities,
  name = "warehouse",
  defaultWarehouse,
}: {
  facilities: Facility[];
  name?: string;
  defaultWarehouse: string;
}) {
  const [selected, setSelected] = useState(defaultWarehouse);

  return (
    <div>
      <input type="hidden" name={name} value={selected} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {facilities.map((f) => {
          const active = selected === f.warehouse;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelected(f.warehouse)}
              aria-pressed={active}
              className={`overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition ${
                active ? "border-[#1b4d38] ring-2 ring-[#1b4d38]/25" : "border-[var(--line)] hover:border-[#1b4d38]/50"
              }`}
            >
              <div className="relative aspect-[16/9] bg-[#dfe6e2]">
                <Image src={f.image} alt={`${f.city} NM-EX warehouse`} fill sizes="(max-width: 1280px) 50vw, 360px" className="object-cover" />
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-[var(--ink)]">
                    {f.city}, {f.state}
                  </p>
                  <span
                    className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      active ? "border-[#1b4d38] bg-[#1b4d38]" : "border-[var(--line)] bg-white"
                    }`}
                    aria-hidden
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                </div>
                <p className="flex items-start gap-1.5 text-xs text-[var(--ink-muted)]">
                  <PinIcon />
                  {f.address}
                </p>
                <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--forest)]">
                  {f.services.map((s) => (
                    <li key={s} className="inline-flex items-center gap-1">
                      <CheckIcon />
                      {s}
                    </li>
                  ))}
                </ul>
                <p className="text-xs font-medium text-[var(--ink-muted)]">
                  {f.kmFromJos === 0 ? "Nearest to you · 0 km" : `${f.kmFromJos} km from Jos`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden className="mt-0.5 shrink-0">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12.5 9.2 17 19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
