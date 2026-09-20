"use client";

import Link from "next/link";
import { Pill } from "@/components/Pill";
import { DISPUTE_SHIELD_DISCLAIMER } from "@/lib/evidence";
import { formatEUR } from "@/lib/format";
import { useStore } from "@/lib/store";

export default function ShieldIndexPage() {
  const { world } = useStore();
  if (!world) return null;
  const ranked = [...world.intents].sort(
    (a, b) => b.evaluation.mismatch.score - a.evaluation.mismatch.score,
  );

  return (
    <div className="space-y-8">
      <header>
        <Pill tone="mock">MVP mock · not scheme cover</Pill>
        <h1 className="mt-3 font-serif text-4xl">Merchant Dispute Shield</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">{DISPUTE_SHIELD_DISCLAIMER}</p>
      </header>
      <ul className="space-y-3">
        {ranked.map((intent) => (
          <li
            key={intent.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white/70 p-4"
          >
            <div>
              <p className="font-medium">
                {intent.merchantName} · {formatEUR(intent.amountCents)}
              </p>
              <p className="text-sm text-ink-soft">
                Purpose: {intent.declaredPurpose} · mismatch{" "}
                {Math.round(intent.evaluation.mismatch.score * 100)}% ·{" "}
                {intent.status}
              </p>
            </div>
            <Link
              href={`/demo/evidence/${intent.id}`}
              className="rounded-full bg-ink px-3 py-1.5 text-sm text-paper"
            >
              Evidence pack
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
