import { redirect } from "next/navigation";
import { isDeskAuthed } from "@/lib/desk-auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function DeskLoginPage() {
  if (await isDeskAuthed()) redirect("/desk");

  return (
    <div className="flex min-h-full flex-col bg-[var(--paper)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-white/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-10">
          <a
            href="/"
            className="font-display text-lg tracking-tight text-[var(--ink)]"
          >
            NM-EX Trace
          </a>
          <a href="/" className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]">
            Board
          </a>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
        <h1 className="font-display text-2xl tracking-tight text-[var(--ink)]">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Ministry and operator desk for tin custody and revenue.
        </p>
        <LoginForm />
      </main>
    </div>
  );
}
