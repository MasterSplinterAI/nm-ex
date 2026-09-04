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
          className={`border-b px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 ${
            step.current ? "bg-[#1b4d38]/8" : "bg-white"
          }`}
        >
          <p className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${step.done || step.current ? "text-[#1b4d38]" : "text-[var(--ink-muted)]"}`}>
            {i + 1}. {step.done ? "✓ " : ""}
            {step.label}
          </p>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">{step.at ? formatDateTime(step.at) : "Pending"}</p>
        </li>
      ))}
    </ol>
  );
}
