"use client";

import { useEffect, useRef, useState } from "react";
import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { inputClass, labelClass } from "@/components/portal/form-styles";
import type { SupplierVocab } from "@/lib/dmo/supplier-vocab";
import { addPurchaseAction } from "./actions";

export type Seller = { id: string; legalName: string; place: string };

const UNREGISTERED = "__unregistered__";

/**
 * Recording a parcel is the main thing a shed does all day, so it is a primary
 * action rather than a side panel. A registered seller is chosen by account so
 * the parcel lands on both ledgers; anyone else is recorded by name.
 */
export function AddPurchase({
  sellers,
  vocab,
  today,
  guidePerKgNgn,
}: {
  sellers: Seller[];
  vocab: SupplierVocab;
  today: string;
  guidePerKgNgn: string;
}) {
  const [open, setOpen] = useState(false);
  const [sellerId, setSellerId] = useState(sellers[0]?.id ?? UNREGISTERED);
  const panelRef = useRef<HTMLDivElement>(null);
  const unregistered = sellerId === UNREGISTERED;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1b4d38] px-4 text-sm font-semibold text-white hover:bg-[#163d2c]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        {vocab.entryPanel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--ink)]/45 p-4 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={vocab.entryTitle}
          onMouseDown={(e) => {
            if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
          }}
        >
          <div ref={panelRef} className="portal-card w-full max-w-lg overflow-hidden shadow-xl">
            <div className="card-head">
              <h2 className="card-title">{vocab.entryTitle}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-white hover:text-[var(--ink)]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <ActionForm action={addPurchaseAction} inline={false}>
                {sellers.length > 0 && (
                  <label className="block">
                    <span className={labelClass}>{vocab.sourceLabel}</span>
                    <select
                      name="sourceParticipantId"
                      value={unregistered ? "" : sellerId}
                      onChange={(e) => setSellerId(e.target.value || UNREGISTERED)}
                      className={`${inputClass} mt-1`}
                    >
                      {sellers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.legalName} — {s.place}
                        </option>
                      ))}
                      <option value="">Not registered with NM-EX…</option>
                    </select>
                    <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                      {unregistered
                        ? "Recorded by name only. The seller has no NM-EX account, so no guaranteed coefficient applies to them."
                        : "This parcel will also appear on the seller's own NM-EX account."}
                    </span>
                  </label>
                )}

                {(unregistered || sellers.length === 0) && (
                  <label className="block">
                    <span className={labelClass}>Seller name (alluvial / unregistered)</span>
                    <input name="source" className={`${inputClass} mt-1`} placeholder={vocab.sourcePlaceholder} required />
                  </label>
                )}

                <label className="block">
                  <span className={labelClass}>Date</span>
                  <input name="date" type="date" defaultValue={today} className={`${inputClass} mt-1`} required />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className={labelClass}>Weight (kg)</span>
                    <input name="kg" type="number" step="0.1" min="0.1" className={`${inputClass} mt-1`} defaultValue={50} required />
                  </label>
                  <label className="block">
                    <span className={labelClass}>Grade (% Sn)</span>
                    <input
                      name="gradePct"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="100"
                      className={`${inputClass} mt-1`}
                      defaultValue={72}
                      required
                    />
                  </label>
                </div>

                <label className="block">
                  <span className={labelClass}>{vocab.costLabel}</span>
                  <input name="valueNgn" type="number" step="1" min="0" className={`${inputClass} mt-1`} defaultValue={2_175_000} />
                  <span className="mt-1 block text-xs text-[var(--ink-muted)]">{guidePerKgNgn}</span>
                </label>

                <label className="block">
                  <span className={labelClass}>Your reference (optional)</span>
                  <input name="reference" className={`${inputClass} mt-1`} placeholder="e.g. RCPT-4421 or cash book folio" />
                  <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                    NM-EX assigns a unique purchase ID when you save.
                  </span>
                </label>

                <div className="flex justify-end gap-2 border-t border-[var(--rule)] pt-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-11 items-center rounded-lg border border-[var(--line-strong)] bg-white px-4 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <ActionButton pendingText="Recording…">{vocab.addButton}</ActionButton>
                </div>
              </ActionForm>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
