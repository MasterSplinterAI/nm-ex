import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { inputClass, labelClass } from "@/components/portal/form-styles";
import { Panel } from "@/components/portal/panel";
import type { DemoState } from "@/lib/dmo/types";
import { updatePolicyAction } from "../actions";

function Field({ name, label, value, step = "0.001", help }: { name: string; label: string; value: number | null; step?: string; help?: string }) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input name={name} type="number" step={step} defaultValue={value ?? ""} className={`${inputClass} mt-1`} />
      {help && <span className="mt-1 block text-xs text-[var(--ink-muted)]">{help}</span>}
    </label>
  );
}

export function PolicyTab({ state }: { state: DemoState }) {
  const p = state.policy;
  return (
    <Panel kicker="Ministry parameters" title="Tin procurement & royalty policy">
      <p className="mb-5 text-sm text-[var(--ink-muted)]">
        These are the levers the Ministry controls. Changes apply to new lots and certificates. Certificates already issued keep the
        parameters and prices that applied at the moment of issue.
      </p>
      <ActionForm action={updatePolicyAction} inline={false}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field name="coefMinerToAggregator" label="Coefficient: miner → aggregator" value={p.coefMinerToAggregator} help="Share of LME reference paid at the shed." />
          <Field name="coefToSmelter" label="Coefficient: → smelter (DMO-A)" value={p.coefToSmelter} help="Applied to the reference value on acceptance." />
          <Field name="ompCoefficient" label="OMP coefficient (optional)" value={p.ompCoefficient} help="Blank = not in force. Official Minimum Price floor." />
          <Field name="royaltyPct" label="Royalty %" value={p.royaltyPct} step="0.1" help="On full contained-metal reference value." />
          <Field name="vatPct" label="VAT %" value={p.vatPct} step="0.1" help="On domestic purchase value; export zero-rated." />
          <Field name="recoveryPct" label="Expected smelter recovery %" value={p.recoveryPct} step="0.1" />
          <Field name="mmlTier1Kg" label="MML tier 1 (kg)" value={p.mmlTier1Kg} step="1" help={`Grade above ${p.tier1MinGradePct}% Sn.`} />
          <Field name="mmlTier2Kg" label="MML tier 2 (kg)" value={p.mmlTier2Kg} step="1" help={`Grade ${p.tier1MinGradePct}% Sn and below.`} />
          <Field name="tier1MinGradePct" label="Tier 1 grade threshold %" value={p.tier1MinGradePct} step="0.1" />
          <Field name="sampleWindowHours" label="Sample window (hours)" value={p.sampleWindowHours} step="1" />
          <Field name="offerPeriodDays" label="Domestic offer period (days)" value={p.offerPeriodDays} step="1" />
          <Field name="paymentWindowDays" label="Payment window (days)" value={p.paymentWindowDays} step="1" />
        </div>
        <div>
          <ActionButton pendingText="Saving…">Save policy</ActionButton>
        </div>
      </ActionForm>
      <div className="mt-6 border-t border-[var(--line)] pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Approved warehouses</p>
        <ul className="mt-2 text-sm">
          {p.warehouses.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      </div>
    </Panel>
  );
}
