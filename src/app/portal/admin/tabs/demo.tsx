import { ActionButton, ActionForm } from "@/components/portal/action-button";
import { Panel } from "@/components/portal/panel";
import { formatDateTime } from "@/lib/format";
import type { DemoState } from "@/lib/dmo/types";
import { advanceClockAction, resetScenarioAction } from "../actions";

export function DemoTab({ state, nowIso }: { state: DemoState; nowIso: string }) {
  const openOffers = state.offers.filter((o) => o.status === "open");
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel kicker="Presentation controls" title="Demo clock">
        <p className="text-sm text-[var(--ink-muted)]">
          Demo time is <strong className="text-[var(--ink)]">{formatDateTime(nowIso)} WAT</strong>
          {state.clockOffsetMs !== 0 && <> (advanced {Math.round(state.clockOffsetMs / 3_600_000)} h)</>}. Advancing the clock lets a
          five-day offer window expire in front of the audience; any offer whose window has passed issues its export clearance certificate
          immediately at the current board price.
        </p>
        <ul className="mt-3 text-sm">
          {openOffers.map((o) => (
            <li key={o.id} className="flex justify-between border-t border-[var(--line)] py-1.5">
              <span className="tabular-nums">{o.lotId}</span>
              <span className="tabular-nums text-[var(--ink-muted)]">closes {formatDateTime(o.closesAt)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          {[24, 72, 120].map((h) => (
            <ActionForm key={h} action={advanceClockAction} hidden={{ hours: String(h) }}>
              <ActionButton tone="secondary" small>+{h} h</ActionButton>
            </ActionForm>
          ))}
        </div>
      </Panel>

      <Panel kicker="Presentation controls" title="Reset scenario">
        <p className="text-sm text-[var(--ink-muted)]">
          Rebuilds the seeded starting point: Solex at 980 kg, one lot awaiting sample, one 25 MT lot open to smelters, one refined lot
          open to buyers, seven certificates on the register, Wamba Tin Shed pending review. Prices are re-snapshotted from the live board.
          Anything created during this session is discarded.
        </p>
        <ActionForm action={resetScenarioAction} confirm="Reset the whole scenario? Everything created this session is discarded." className="mt-4">
          <ActionButton tone="danger" pendingText="Rebuilding…">Reset to seeded scenario</ActionButton>
        </ActionForm>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)]">Seeded {formatDateTime(state.seededAt)}</p>
      </Panel>
    </div>
  );
}
