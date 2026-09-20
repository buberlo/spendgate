"use client";

import Link from "next/link";
import { Pill } from "@/components/Pill";
import { formatEURCompact, kindLabel, roleLabel } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function PoliciesPage() {
  const { world } = useStore();
  if (!world) return null;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
            Multi-principal
          </p>
          <h1 className="font-serif text-4xl">Policies</h1>
        </div>
        <Link
          href="/demo/policies/new"
          className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
        >
          Create policy
        </Link>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {world.policies.map((policy) => {
          const people = world.principals.filter((p) =>
            policy.principalIds.includes(p.id),
          );
          return (
            <Link
              key={policy.id}
              href={`/demo/policies/${policy.id}`}
              className="rounded-2xl border border-line bg-white/70 p-5 hover:border-ink/40"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-serif text-2xl">{policy.name}</h2>
                <Pill tone="active">{kindLabel(policy.kind)}</Pill>
              </div>
              <ul className="mt-4 space-y-1 text-sm">
                {policy.hierarchy
                  .slice()
                  .sort((a, b) => a.rank - b.rank)
                  .map((rung) => {
                    const person = people.find((p) => p.id === rung.principalId);
                    return (
                      <li key={rung.principalId} className="flex justify-between gap-3">
                        <span>
                          {person?.name}{" "}
                          <span className="text-ink-soft">
                            ({roleLabel(person?.role ?? "spender")})
                          </span>
                        </span>
                        <span className="font-mono text-xs text-ink-soft">
                          auto {formatEURCompact(rung.autoApproveCents)} · hard{" "}
                          {formatEURCompact(rung.hardApproveCents)}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
