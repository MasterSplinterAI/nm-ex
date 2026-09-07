import { formatDateTime } from "@/lib/format";
import type { AssayStep } from "@/lib/dmo/lot-view";

export function LotStepper({ steps, variant = "bar" }: { steps: AssayStep[]; variant?: "bar" | "stack" }) {
  if (variant === "stack") {
    return (
      <ol className="space-y-2.5">
        {steps.map((step, i) => (
          <li key={step.id} className="flex gap-2.5 text-sm">
            <span className={`mt-0.5 w-4 shrink-0 text-xs font-semibold ${step.done || step.current ? "text-[#1b4d38]" : "text-[var(--ink-muted)]"}`}>
              {step.done ? "✓" : i + 1}
            </span>
            <div>
              <p className={step.current ? "font-semibold text-[#1b4d38]" : step.done ? "font-medium" : "text-[var(--ink-muted)]"}>{step.label}</p>
              <p className="text-xs text-[var(--ink-muted)]">{step.at ? formatDateTime(step.at) : "Pending"}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <ol className="portal-card grid gap-0 overflow-hidden sm:grid-cols-5">
      {steps.map((step, i) => (
        <li
          key={step.id}
          className={`border-b border-[var(--line-strong)] px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${
            step.current ? "bg-[#1b4d38]/8" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                step.done ? "bg-[#1b4d38] text-white" : step.current ? "bg-[#1b4d38]/15 text-[#1b4d38]" : "bg-[var(--paper)] text-[var(--ink-soft)]"
              }`}
            >
              {step.done ? "✓" : i + 1}
            </span>
            <p className={`text-[13px] font-semibold leading-tight ${step.done || step.current ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"}`}>
              {step.label}
            </p>
          </div>
          <p className="mt-1 pl-7 text-xs text-[var(--ink-soft)]">{step.at ? formatDateTime(step.at) : "Pending"}</p>
        </li>
      ))}
    </ol>
  );
}
