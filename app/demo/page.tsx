"use client";

import Link from "next/link";
import { DemoVideo } from "@/components/DemoVideo";
import { Pill } from "@/components/Pill";
import { formatEUR, formatWhen, kindLabel } from "@/lib/format";
import { useStore } from "@/lib/store";
import { shortHash } from "@/lib/hash";

export default function DemoOverviewPage() {
  const { world } = useStore();
  if (!world) return null;

  const pending = world.intents.filter(
    (intent) => intent.status === "escalated" || intent.status === "pending",
  );
  const recent = world.intents.slice(0, 5);
  const lastHash = world.audit.at(-1)?.hash ?? "";

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
            Sandbox ledger
          </p>
          <h1 className="mt-1 font-serif text-4xl">Mandate desk</h1>
          <p className="mt-2 max-w-2xl text-ink-soft">
            Two live policies, bound agents, and a hash-chained log. Run a
            simulated intent, approve as a principal, export an evidence pack.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/demo/intents"
            className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
          >
            Run an intent
          </Link>
          <Link
            href="/demo/policies/new"
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            New policy
          </Link>
        </div>
      </header>

      <section id="walkthrough">
        <DemoVideo />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Policies in force", String(world.policies.filter((p) => p.status === "active").length)],
          ["Awaiting a principal", String(pending.length)],
          ["Audit sequence", String(world.audit.at(-1)?.seq ?? 0)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-line bg-white/70 p-5">
            <p className="text-sm text-ink-soft">{label}</p>
            <p className="mt-1 font-serif text-4xl">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-line bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Awaiting approval</h2>
            <Link href="/demo/intents" className="text-sm text-ink-soft">
              All intents
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line/70">
            {pending.length === 0 ? (
              <li className="py-6 text-ink-soft">No principal is on the clock.</li>
            ) : (
              pending.map((intent) => {
                const waiting = world.principals.find(
                  (p) => p.id === intent.waitingOnPrincipalId,
                );
                return (
                  <li key={intent.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="font-medium">
                        {intent.merchantName} · {formatEUR(intent.amountCents)}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {intent.declaredPurpose} · waiting on {waiting?.name ?? "—"}
                      </p>
                    </div>
                    <Link
                      href={`/demo/intents/${intent.id}`}
                      className="rounded-full bg-seal px-3 py-1.5 text-sm text-paper"
                    >
                      Decide
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="font-serif text-2xl">Policies</h2>
          <ul className="mt-4 space-y-3">
            {world.policies.map((policy) => (
              <li key={policy.id}>
                <Link href={`/demo/policies/${policy.id}`} className="block rounded-xl border border-line/80 p-3 hover:bg-paper">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{policy.name}</p>
                    <Pill tone="active">{kindLabel(policy.kind)}</Pill>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-ink-soft">
                    {policy.principalIds.length} principals · mandate{" "}
                    {shortHash(policy.mandateId, 6, 4)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white/70 p-5">
        <h2 className="font-serif text-2xl">Recent evaluations</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">
              <tr>
                <th className="pb-2 font-normal">When</th>
                <th className="pb-2 font-normal">Merchant</th>
                <th className="pb-2 font-normal">Amount</th>
                <th className="pb-2 font-normal">Gate</th>
                <th className="pb-2 font-normal">Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {recent.map((intent) => (
                <tr key={intent.id}>
                  <td className="py-2 text-ink-soft">{formatWhen(intent.submittedAt)}</td>
                  <td className="py-2">
                    <Link href={`/demo/intents/${intent.id}`} className="hover:underline">
                      {intent.merchantName}
                    </Link>
                  </td>
                  <td className="py-2">{formatEUR(intent.amountCents)}</td>
                  <td className="py-2">
                    <Pill tone={intent.status}>{intent.status}</Pill>
                  </td>
                  <td className="py-2 font-mono text-xs">{intent.snapshot.agent.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 font-mono text-[11px] text-ink-soft">
          Chain head {shortHash(lastHash)}
        </p>
      </section>
    </div>
  );
}
