import { LiveClock } from "@/components/live-clock";
import { NigeriaFlag } from "@/components/nigeria-flag";
import { ROLE_SHORT } from "@/lib/dmo/labels";
import type { Participant } from "@/lib/dmo/types";
import { roleHome } from "@/lib/dmo/session";
import { logout } from "./actions";

export function PortalNav({ participant, demoNowIso, clockOffsetMs }: { participant: Participant; demoNowIso: string; clockOffsetMs: number }) {
  const home = roleHome(participant.role);
  const shifted = clockOffsetMs !== 0;
  return (
    <header className="border-b border-[var(--line)] bg-white/80 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-4">
          <a href={home} className="font-display text-lg tracking-tight text-[var(--ink)]">
            NM-EX <span className="text-[var(--ink-muted)]">Portal</span>
          </a>
          <span className="hidden text-[var(--ink)]/25 sm:inline">|</span>
          <div className="hidden leading-tight sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
              {ROLE_SHORT[participant.role]}
            </p>
            <p className="text-sm text-[var(--ink)]">
              {participant.legalName}
              {participant.regNo && <span className="ml-2 tabular-nums text-[var(--ink-muted)]">{participant.regNo}</span>}
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-3 text-sm text-[var(--ink-muted)] sm:gap-5">
          <a href="/" className="hidden hover:text-[var(--ink)] sm:inline">
            Spot board
          </a>
          <a href="/verify" className="hover:text-[var(--ink)]">
            Verify
          </a>
          {shifted ? (
            <span className="text-xs text-[var(--copper)]" title="Demo clock is advanced">
              Demo time{" "}
              {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(demoNowIso))}
            </span>
          ) : (
            <LiveClock className="hidden text-[var(--ink)] md:inline" />
          )}
          <form action={logout}>
            <button type="submit" className="h-9 border border-[var(--line)] bg-white px-3 text-xs font-semibold text-[var(--ink)] hover:border-[var(--ink)]">
              Sign out
            </button>
          </form>
          <NigeriaFlag className="h-4 w-6 shrink-0 shadow-sm" />
        </nav>
      </div>
    </header>
  );
}
