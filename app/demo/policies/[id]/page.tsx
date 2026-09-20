"use client";

import Link from "next/link";
import { use, useMemo } from "react";
import { Pill } from "@/components/Pill";
import {
  categoryLabel,
  formatEUR,
  formatEURCompact,
  formatWhen,
  kindLabel,
  minuteToClock,
  roleLabel,
  weekdayLabel,
} from "@/lib/format";
import { shortHash } from "@/lib/hash";
import { useStore } from "@/lib/store";

export default function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { world } = useStore();
  const policy = world?.policies.find((item) => item.id === id);
  const contract = world?.contracts.find((item) => item.id === policy?.contractId);
  const mandate = world?.mandates.find((item) => item.id === policy?.mandateId);
  const agent = world?.agents.find((item) => item.id === contract?.agentId);
  const people = useMemo(
    () =>
      world?.principals.filter((person) => policy?.principalIds.includes(person.id)) ??
      [],
    [world, policy],
  );

  if (!world) return null;
  if (!policy || !contract || !mandate || !agent) {
    return (
      <p className="text-ink-soft">
        Unknown policy. <Link href="/demo/policies">Back</Link>
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
            {policy.jurisdiction} · {kindLabel(policy.kind)}
          </p>
          <h1 className="font-serif text-4xl">{policy.name}</h1>
          <p className="mt-1 font-mono text-xs text-ink-soft">{policy.id}</p>
        </div>
        <Link
          href={`/demo/intents?agent=${agent.id}`}
          className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
        >
          Run intent for {agent.name}
        </Link>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="font-serif text-2xl">Approval hierarchy</h2>
          <ol className="mt-4 space-y-3">
            {policy.hierarchy
              .slice()
              .sort((a, b) => a.rank - b.rank)
              .map((rung) => {
                const person = people.find((p) => p.id === rung.principalId);
                return (
                  <li
                    key={rung.principalId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line/80 px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">{person?.name}</p>
                      <p className="text-sm text-ink-soft">
                        rank {rung.rank} · {roleLabel(person?.role ?? "spender")}
                      </p>
                    </div>
                    <p className="text-right font-mono text-[11px] text-ink-soft">
                      auto {formatEURCompact(rung.autoApproveCents)}
                      <br />
                      hard {formatEURCompact(rung.hardApproveCents)}
                    </p>
                  </li>
                );
              })}
          </ol>
        </article>

        <article className="rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="font-serif text-2xl">Spend contract</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row k="Per intent" v={formatEUR(contract.perIntentCents)} />
            <Row k="Daily / weekly / monthly" v={`${formatEUR(contract.dailyCents)} · ${formatEUR(contract.weeklyCents)} · ${formatEUR(contract.monthlyCents)}`} />
            <Row
              k="Allow"
              v={contract.allowedCategories.map(categoryLabel).join(", ")}
            />
            <Row
              k="Deny"
              v={contract.deniedCategories.map(categoryLabel).join(", ") || "—"}
            />
            <Row
              k="Window"
              v={`${contract.window.days.map(weekdayLabel).join(" ")} · ${minuteToClock(contract.window.startMinute)}–${minuteToClock(contract.window.endMinute)} ${contract.window.tz}`}
            />
            <Row k="Bound agent" v={`${agent.name} · ${agent.runtime}`} />
            <Row k="Fingerprint" v={agent.identityFingerprint} mono />
          </dl>
        </article>
      </section>

      <article className="rounded-2xl border border-seal/25 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-serif text-2xl">Sealed mandate</h2>
          <Pill tone="active">{mandate.status}</Pill>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          Issued {formatWhen(mandate.issuedAt)} by{" "}
          {people.find((p) => p.id === mandate.issuedByPrincipalId)?.name ?? "—"}
        </p>
        <p className="mt-3 font-mono text-xs leading-6">
          {mandate.id}
          <br />
          termsHash {shortHash(mandate.termsHash)}
        </p>
      </article>
    </div>
  );
}

function Row({
  k,
  v,
  mono,
}: {
  k: string;
  v: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/60 py-1.5">
      <dt className="text-ink-soft">{k}</dt>
      <dd className={`text-right ${mono ? "font-mono text-xs" : ""}`}>{v}</dd>
    </div>
  );
}
