"use client";

import { useActionState } from "react";
import { loginDesk } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginDesk, null);

  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="text-xs uppercase tracking-[0.16em] text-[var(--ink-muted)]">
          Password
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="mt-2 h-12 w-full border border-[var(--line)] bg-white px-3 text-[var(--ink)]"
        />
      </label>
      {state?.error && (
        <p className="text-sm text-[var(--copper)]" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-[var(--ink)] text-sm font-semibold text-[var(--paper)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Enter"}
      </button>
    </form>
  );
}
