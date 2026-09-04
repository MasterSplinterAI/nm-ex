"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export type ActionResult = { error?: string; ok?: string } | null;

type ButtonTone = "primary" | "secondary" | "danger" | "ghost";

const TONE: Record<ButtonTone, string> = {
  primary: "rounded-lg bg-[#1b4d38] text-white hover:bg-[#163d2c]",
  secondary: "rounded-lg border border-[var(--ink)]/30 bg-white text-[var(--ink)] hover:border-[var(--ink)]",
  danger: "rounded-lg border border-[#9b2c2c]/40 bg-white text-[#9b2c2c] hover:bg-[#9b2c2c]/5",
  ghost: "text-[var(--ink-muted)] hover:text-[var(--ink)] underline-offset-4 hover:underline",
};

export function ActionButton({
  children,
  tone = "primary",
  small = false,
  disabled = false,
  pendingText,
  className = "",
  type = "submit",
}: {
  children: ReactNode;
  tone?: ButtonTone;
  small?: boolean;
  disabled?: boolean;
  pendingText?: string;
  className?: string;
  type?: "submit" | "button";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type={type}
      disabled={disabled || pending}
      className={`inline-flex items-center justify-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        small ? "h-9 px-3 text-xs" : "h-11 px-5 text-sm"
      } ${TONE[tone]} ${className}`}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

/**
 * A form that posts hidden fields to a server action and shows its result.
 * Use for one-click transitions (Accept, Approve, Mark received…).
 */
export function ActionForm({
  action,
  hidden = {},
  children,
  confirm,
  className = "",
  inline = true,
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  hidden?: Record<string, string>;
  children: ReactNode;
  confirm?: string;
  className?: string;
  inline?: boolean;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className={`${inline ? "inline-flex flex-col items-start gap-1" : "flex flex-col gap-3"} ${className}`}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      {state?.error && (
        <p className="text-xs text-[#9b2c2c]" role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && <p className="text-xs text-[var(--forest)]">{state.ok}</p>}
    </form>
  );
}

export { inputClass, labelClass } from "./form-styles";
