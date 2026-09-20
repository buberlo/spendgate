"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { useStore } from "@/lib/store";

const NAV = [
  { href: "/demo", label: "Overview" },
  { href: "/demo/policies", label: "Policies" },
  { href: "/demo/agents", label: "Agents" },
  { href: "/demo/intents", label: "Intents" },
  { href: "/demo/audit", label: "Audit log" },
  { href: "/demo/shield", label: "Dispute Shield" },
];

export function DemoShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { world, ready, acting, setActing, resetDemo } = useStore();

  return (
    <div className="min-h-full bg-paper">
      <header className="no-print sticky top-0 z-20 border-b border-line/80 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="shrink-0">
            <BrandMark compact />
          </Link>
          <nav className="hidden items-center gap-1 overflow-x-auto md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/demo"
                  ? pathname === "/demo"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1 text-sm ${
                    active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-2"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <label className="hidden text-[11px] uppercase tracking-wider text-ink-soft sm:block">
              Act as
            </label>
            <select
              className="max-w-[11rem] rounded-full border border-line bg-white px-3 py-1.5 text-sm"
              value={world?.actingPrincipalId ?? ""}
              onChange={(e) => setActing(e.target.value)}
              disabled={!ready}
            >
              {world?.principals.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-line/60 px-3 py-2 md:hidden">
          {NAV.map((item) => {
            const active =
              item.href === "/demo"
                ? pathname === "/demo"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3 py-1 text-sm ${
                  active ? "bg-ink text-paper" : "bg-paper-2 text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        {!ready || !world ? (
          <p className="font-serif text-2xl text-ink-soft">Sealing the ledger…</p>
        ) : (
          children
        )}
      </main>
      <footer className="no-print mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-10 text-xs text-ink-soft">
        <p>
          Sandbox · acting as <span className="text-ink">{acting?.name ?? "—"}</span>
          . Persistence is local to this browser.
        </p>
        <button
          type="button"
          onClick={() => void resetDemo()}
          className="rounded-full border border-line px-3 py-1 hover:bg-paper-2"
        >
          Reset demo
        </button>
      </footer>
    </div>
  );
}
