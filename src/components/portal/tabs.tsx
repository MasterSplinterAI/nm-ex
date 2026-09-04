export type TabDef = { id: string; label: string; badge?: number };

export function Tabs({ base, tabs, active }: { base: string; tabs: TabDef[]; active: string }) {
  return (
    <nav className="-mx-4 mb-6 overflow-x-auto border-b border-[var(--line)] px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <li key={tab.id}>
              <a
                href={`${base}?tab=${tab.id}`}
                className={`inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm transition ${
                  isActive
                    ? "border-[var(--forest)] font-semibold text-[var(--ink)]"
                    : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
                {tab.badge != null && tab.badge > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center bg-[var(--copper)] px-1.5 text-[10px] font-bold text-white">
                    {tab.badge}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
