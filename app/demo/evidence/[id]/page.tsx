"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Pill } from "@/components/Pill";
import {
  buildEvidencePack,
  DISPUTE_SHIELD_DISCLAIMER,
  type EvidencePack,
} from "@/lib/evidence";
import { formatEUR, formatWhen } from "@/lib/format";
import { shortHash } from "@/lib/hash";
import { useStore } from "@/lib/store";

export default function EvidencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { world } = useStore();
  const intent = world?.intents.find((item) => item.id === id);
  const [pack, setPack] = useState<EvidencePack | null>(null);

  useEffect(() => {
    if (!world || !intent) return;
    let cancelled = false;
    buildEvidencePack(intent, world.audit).then((next) => {
      if (!cancelled) setPack(next);
    });
    return () => {
      cancelled = true;
    };
  }, [world, intent]);

  if (!world) return null;
  if (!intent) {
    return (
      <p className="text-ink-soft">
        Unknown intent. <Link href="/demo/shield">Back to Shield</Link>
      </p>
    );
  }

  function download() {
    if (!pack) return;
    const blob = new Blob([JSON.stringify(pack, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pack.packId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/demo/shield" className="text-sm text-ink-soft">
          ← Dispute Shield
        </Link>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={download}
            className="rounded-full border border-line px-4 py-2 text-sm"
          >
            Download JSON
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
          >
            Print / save PDF
          </button>
        </div>
      </div>

      <article className="print-pack rounded-2xl border border-ink/20 bg-white p-6 sm:p-8">
        <Pill tone="mock">MVP mock · not scheme cover</Pill>
        <h1 className="mt-4 font-serif text-4xl">Evidence pack</h1>
        <p className="mt-3 max-w-2xl text-sm text-ink-soft">
          {DISPUTE_SHIELD_DISCLAIMER}
        </p>

        {!pack ? (
          <p className="mt-8 font-serif text-2xl text-ink-soft">Assembling pack…</p>
        ) : (
          <div className="mt-8 space-y-8">
            <section>
              <h2 className="font-serif text-2xl">Intent</h2>
              <p className="mt-2">
                {intent.merchantName} charged {formatEUR(intent.amountCents)} for
                “{intent.declaredPurpose}” via {intent.snapshot.agent.name} on{" "}
                {formatWhen(intent.occurredAt)}. Gate: {intent.status}.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl">Mandate snapshot</h2>
              <p className="mt-2 text-sm">
                {intent.snapshot.mandate.id} · termsHash{" "}
                <span className="font-mono">
                  {shortHash(intent.snapshot.mandate.termsHash)}
                </span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Policy {intent.snapshot.policy.name} · agent fingerprint{" "}
                {intent.snapshot.agent.identityFingerprint}
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl">Intent-mismatch analysis</h2>
              <p className="mt-2 text-sm">
                Score {Math.round(pack.mismatch.score * 100)} / 100
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-ink-soft">
                {pack.mismatch.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl">Evaluation findings</h2>
              <ul className="mt-3 space-y-2">
                {pack.evaluation.findings.map((finding) => (
                  <li key={finding.code} className="text-sm">
                    <span className="font-mono text-[11px]">{finding.code}</span>{" "}
                    — {finding.title}. {finding.detail}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-2xl">Hash chain</h2>
              <p className="mt-2 text-sm">
                Full ledger verification:{" "}
                <strong>{pack.chain.ok ? "intact" : "BROKEN"}</strong>
                {pack.chain.detail ? ` · ${pack.chain.detail}` : ""}
              </p>
              <p className="mt-2 font-mono text-[11px] leading-5 text-ink-soft">
                head {pack.chain.head}
                <br />
                tail {pack.chain.tail}
              </p>
            </section>

            <section>
              <h2 className="font-serif text-2xl">Related audit entries</h2>
              <ol className="mt-3 space-y-1 font-mono text-[11px]">
                {pack.audit.map((event) => (
                  <li key={event.id}>
                    #{event.seq} {event.type} · {shortHash(event.hash)}
                  </li>
                ))}
              </ol>
            </section>

            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">
              Pack {pack.packId} · generated {pack.generatedAt}
            </p>
          </div>
        )}
      </article>
    </div>
  );
}
