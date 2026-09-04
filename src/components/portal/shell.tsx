"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { NmexMark } from "@/components/brand/nmex-mark";
import { NigeriaFlag } from "@/components/nigeria-flag";
import { NavIcon } from "@/components/portal/nav-icons";
import { logout } from "@/app/portal/actions";
import { CATEGORY_LABEL, ROLE_SHORT } from "@/lib/dmo/labels";
import { placeFromAddress } from "@/lib/dmo/facilities";
import type { NavItem } from "@/lib/dmo/nav";
import type { Participant } from "@/lib/dmo/types";

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
  const alerts = nav.reduce((n, item) => n + (item.badge ?? 0), 0);
  const category = participant.category ? CATEGORY_LABEL[participant.category] : ROLE_SHORT[participant.role];
  const place = placeFromAddress(participant.address);
  const homeHref = nav[0]?.href ?? "/portal";
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
      <div className="flex h-full flex-col bg-[#161b18]">
        <div className={`border-b border-white/10 ${slim ? "px-2 py-4 text-center" : "px-4 py-4"}`}>
          {!slim && (
            <>
              <p className="truncate text-sm font-semibold text-white">{participant.legalName}</p>
              <p className="mt-0.5 truncate text-[11px] leading-snug text-white/55">{category}</p>
              <p className="truncate text-[11px] text-white/45">{place}</p>
            </>
          )}
          {slim && <span className="font-display text-sm text-white">{participant.legalName.slice(0, 1)}</span>}
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
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                          active ? "bg-[#1b4d38] font-semibold text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                        } ${slim ? "justify-center px-2" : ""}`}
                      >
                        <NavIcon id={item.id} />
                        {!slim && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge != null && item.badge > 0 && (
                              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c45c26] px-1.5 text-[10px] font-bold text-white">
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
        {!slim && (
          <div className="relative mt-auto h-40 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/portal/sidebar-minerals.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/10" />
            <div className="relative flex h-full flex-col justify-end p-3 text-white">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em]">Nigeria&apos;s minerals, our future</p>
              <p className="mt-1 text-[10px] leading-snug text-white/75">Transparent markets, fair prices, stronger communities.</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--paper)] text-[var(--ink)]">
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white pt-[env(safe-area-inset-top)] print:hidden">
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--line)] bg-white lg:hidden"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden>
                <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="1.75" />
              </svg>
            </button>
            <button
              type="button"
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--ink-muted)] hover:text-[var(--ink)] lg:inline-flex"
              aria-label={collapsed ? "Expand menu" : "Collapse menu"}
              onClick={() => setCollapsed((v) => !v)}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d={collapsed ? "M6 3l5 5-5 5" : "M10 3L5 8l5 5"} fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </button>
            <a href={homeHref} className="flex min-w-0 items-center gap-2.5">
              <NmexMark />
              <NigeriaFlag className="hidden h-4 w-6 shrink-0 shadow-sm sm:block" />
            </a>
          </div>
          <p className="hidden text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ink-muted)] lg:block">
            A stronger Nigeria through responsible minerals
          </p>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={nav.find((n) => n.badge)?.href ?? homeHref}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[var(--ink-muted)] hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              aria-label={alerts ? `${alerts} items need attention` : "Notifications"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 16h12l-1.2-2.2V10a4.8 4.8 0 1 0-9.6 0v3.8L6 16zM10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              </svg>
              {alerts > 0 && (
                <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#c01818] px-1 text-[9px] font-bold text-white">
                  {alerts > 9 ? "9+" : alerts}
                </span>
              )}
            </a>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-[var(--paper)] [&::-webkit-details-marker]:hidden">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#1b4d38] text-xs font-semibold text-white">
                  {initials(participant.contactName)}
                </span>
                <span className="hidden leading-tight sm:block">
                  <span className="block text-sm font-semibold text-[var(--ink)]">{participant.contactName}</span>
                  <span className="block text-[11px] text-[var(--ink-muted)]">{ROLE_SHORT[participant.role]}</span>
                </span>
              </summary>
              <div className="absolute right-0 z-50 mt-1 w-56 rounded-xl border border-[var(--line)] bg-white p-2 text-sm shadow-lg">
                {shifted && (
                  <p className="px-2 py-1.5 text-xs text-[var(--copper)]">
                    Demo clock{" "}
                    {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" }).format(
                      new Date(demoNowIso),
                    )}
                  </p>
                )}
                <a href="/" className="block rounded-lg px-2 py-2 hover:bg-[var(--paper)]">
                  Spot board
                </a>
                <a href="/verify" className="block rounded-lg px-2 py-2 hover:bg-[var(--paper)]">
                  Verify a certificate
                </a>
                <form action={logout}>
                  <button type="submit" className="w-full rounded-lg px-2 py-2 text-left hover:bg-[var(--paper)]">
                    Sign out
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className={`sticky top-[3.25rem] hidden h-[calc(100dvh-3.25rem)] shrink-0 self-start print:hidden lg:block ${collapsed ? "w-[4.5rem]" : "w-64"}`}>
          {sidebar("desktop")}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden print:hidden">
            <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">{sidebar("mobile")}</aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-5 sm:px-6 sm:py-7">{children}</main>
          <footer className="border-t border-[var(--line)] bg-white px-4 py-4 print:hidden">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-[var(--ink-muted)] sm:flex-row">
              <NmexMark />
              <nav className="flex flex-wrap items-center justify-center gap-4">
                <a href="/exchange" className="hover:text-[var(--ink)]">
                  About
                </a>
                <a href="/exchange" className="hover:text-[var(--ink)]">
                  Rules &amp; standards
                </a>
                <a href="/verify" className="hover:text-[var(--ink)]">
                  Help
                </a>
                <a href="/register" className="hover:text-[var(--ink)]">
                  Contact
                </a>
              </nav>
              <p>From Nigeria&apos;s mines to a stronger tomorrow.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "N") + (parts[1]?.[0] ?? "")).toUpperCase();
}
