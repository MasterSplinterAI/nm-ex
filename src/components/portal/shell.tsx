"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LiveClock } from "@/components/live-clock";
import { NigeriaFlag } from "@/components/nigeria-flag";
import { ROLE_SHORT } from "@/lib/dmo/labels";
import type { NavItem } from "@/lib/dmo/nav";
import type { Participant } from "@/lib/dmo/types";
import { logout } from "@/app/portal/actions";

function isActive(item: NavItem, pathname: string, tab: string | null): boolean {
  const url = new URL(item.href, "http://local");
  if (url.pathname !== pathname) return false;
  const itemTab = url.searchParams.get("tab");
  if (!itemTab) return !tab || tab === "home" || tab === "overview";
  return tab === itemTab;
}

export function PortalShell({
  participant,
  nav,
  demoNowIso,
  clockOffsetMs,
  children,
}: {
  participant: Participant;
  nav: NavItem[];
  demoNowIso: string;
  clockOffsetMs: number;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const search = useSearchParams();
  const tab = search.get("tab");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const shifted = clockOffsetMs !== 0;

  function toggleCollapsed() {
    setCollapsed((v) => !v);
  }

  const groups: { name: string | null; items: NavItem[] }[] = [];
  for (const item of nav) {
    const name = item.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.items.push(item);
    else groups.push({ name, items: [item] });
  }

  const sidebar = (mode: "desktop" | "mobile") => {
    const slim = mode === "desktop" && collapsed;
    return (
      <div className="flex h-full flex-col">
        <div className={`flex items-center gap-3 border-b border-white/10 px-4 py-4 ${slim ? "justify-center px-2" : ""}`}>
          <a href={nav[0]?.href ?? "/portal"} className="font-display text-lg tracking-tight text-white">
            {slim ? "N" : "NM-EX"}
          </a>
          {!slim && <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">Registry</span>}
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((group, i) => (
            <div key={group.name ?? `g-${i}`} className={i > 0 ? "mt-4" : ""}>
              {group.name && !slim && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">{group.name}</p>
              )}
              {slim && i > 0 && <div className="mx-2 mb-2 border-t border-white/10" />}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item, pathname, tab);
                  return (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        title={item.label}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition ${
                          active ? "bg-white/15 font-semibold text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                        } ${slim ? "justify-center px-2" : ""}`}
                      >
                        {slim ? (
                          <span className="font-display text-xs">{item.label.slice(0, 2)}</span>
                        ) : (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge != null && item.badge > 0 && (
                              <span className="inline-flex h-5 min-w-5 items-center justify-center bg-[var(--copper)] px-1.5 text-[10px] font-bold text-white">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className={`border-t border-white/10 px-3 py-3 text-xs text-white/50 ${slim ? "text-center" : ""}`}>
          {slim ? participant.role.slice(0, 1).toUpperCase() : ROLE_SHORT[participant.role]}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-dvh bg-[var(--paper)] text-[var(--ink)]">
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 bg-[#0f1613] print:hidden lg:block ${collapsed ? "w-[4.25rem]" : "w-60"}`}
      >
        {sidebar("desktop")}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden print:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0f1613] shadow-2xl">{sidebar("mobile")}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-sm print:hidden">
          <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center border border-[var(--line)] bg-white lg:hidden"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden>
                  <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.75" />
                </svg>
              </button>
              <button
                type="button"
                className="hidden h-10 w-10 items-center justify-center border border-[var(--line)] bg-white text-[var(--ink-muted)] hover:text-[var(--ink)] lg:inline-flex"
                aria-label={collapsed ? "Expand menu" : "Collapse menu"}
                onClick={toggleCollapsed}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                  <path d={collapsed ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"} fill="none" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--forest)]">
                  {ROLE_SHORT[participant.role]}
                </p>
                <p className="truncate text-sm text-[var(--ink)]">
                  {participant.legalName}
                  {participant.regNo && <span className="ml-2 hidden tabular-nums text-[var(--ink-muted)] sm:inline">{participant.regNo}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)] sm:gap-4">
              <Link href="/" className="hidden hover:text-[var(--ink)] md:inline">
                Spot board
              </Link>
              <a href="/verify" className="hidden hover:text-[var(--ink)] sm:inline">
                Verify
              </a>
              {shifted ? (
                <span className="max-w-[9rem] truncate text-xs text-[var(--copper)] sm:max-w-none" title="Demo clock is advanced">
                  Demo{" "}
                  {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(
                    new Date(demoNowIso),
                  )}
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
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-5 sm:px-6 sm:py-7">{children}</main>
        <footer className="border-t border-[var(--line)] px-4 py-3 text-center text-xs text-[var(--ink-muted)] print:hidden">
          NM-EX national tin registry · demonstration · the live electronic record is authoritative
        </footer>
      </div>
    </div>
  );
}
