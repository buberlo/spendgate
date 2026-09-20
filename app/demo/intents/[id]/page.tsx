"use client";

import Link from "next/link";
import { use, useState } from "react";
import { Pill } from "@/components/Pill";
import { canDecide } from "@/lib/engine";
import { formatEUR, formatWhen, roleLabel } from "@/lib/format";
import { shortHash } from "@/lib/hash";
import { useStore } from "@/lib/store";
import type { GateDecision } from "@/lib/types";

export default function IntentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { world, acting, decideIntent } = useStore();
  const intent = world?.intents.find((item) => item.id === id);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<GateDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!world) return null;
  if (!intent || !acting) {
    return (
      <p className="text-ink-soft">
        Unknown intent. <Link href="/demo/intents">Back</Link>
      </p>
    );
  }

  const openIntent = intent;
  const waiting = world.principals.find((p) => p.id === openIntent.waitingOnPrincipalId);
  const gate = canDecide({
    actor: acting,
    intent: openIntent,
    principals: world.principals,
  });

  async function decide(action: GateDecision) {
    setBusy(action);
    setError(null);
    try {
      await decideIntent({ intentId: openIntent.id, action, note });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Decision failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
            Intent {intent.id}
          </p>
          <h1 className="font-serif text-4xl">
            {intent.merchantName} · {formatEUR(intent.amountCents)}
          </h1>
          <p className="mt-2 text-ink-soft">{intent.declaredPurpose}</p>
        </div>
        <Pill tone={intent.status}>{intent.status}</Pill>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="font-serif text-2xl">Submitted by agent</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row k="Agent" v={intent.snapshot.agent.name} />
            <Row k="Runtime" v={intent.snapshot.agent.runtime} />
            <Row k="Claimed fingerprint" v={shortHash(intent.claimedFingerprint)} mono />
            <Row
              k="Bound fingerprint"
              v={shortHash(intent.snapshot.agent.identityFingerprint)}
              mono
            />
            <Row k="Occurred" v={formatWhen(intent.occurredAt)} />
            <Row k="Mandate" v={intent.mandateId} mono />
            <Row k="Policy" v={intent.snapshot.policy.name} />
          </dl>
        </article>

        <article className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Gate findings</h2>
            <Pill tone={intent.evaluation.decision}>
              {intent.evaluation.decision}
            </Pill>
          </div>
          <p className="mt-2 text-sm text-ink-soft">{intent.evaluation.reasonSummary}</p>
          <ul className="mt-4 space-y-2">
            {intent.evaluation.findings.map((finding) => (
              <li key={finding.code} className="rounded-xl border border-line/70 px-3 py-2 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{finding.title}</span>
                  <Pill tone={finding.severity}>{finding.severity}</Pill>
                </div>
                <p className="text-ink-soft">{finding.detail}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-line bg-white/70 p-5">
        <h2 className="font-serif text-2xl">Approval</h2>
        {intent.status === "escalated" ? (
          <p className="mt-2 text-sm text-ink-soft">
            Waiting on <strong className="text-ink">{waiting?.name}</strong>
            {waiting ? ` (${roleLabel(waiting.role)})` : ""}. Act as that
            principal — or a higher-rank override — to allow, deny, or escalate.
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">
            This intent is closed. The decision trail below is part of the
            evidence pack.
          </p>
        )}

        {intent.status === "escalated" ? (
          <div className="mt-4 space-y-3">
            <textarea
              className="w-full rounded-xl border border-line px-3 py-2 text-sm"
              rows={3}
              placeholder="Decision note (sealed into the audit log)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {!gate.ok ? (
              <p className="text-sm text-seal">
                {gate.reason} Switch principal in the header.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!gate.ok || busy !== null}
                onClick={() => void decide("allow")}
                className="rounded-full bg-ok px-4 py-2 text-paper disabled:opacity-40"
              >
                {busy === "allow" ? "Sealing…" : "Allow"}
              </button>
              <button
                type="button"
                disabled={!gate.ok || busy !== null}
                onClick={() => void decide("deny")}
                className="rounded-full bg-seal px-4 py-2 text-paper disabled:opacity-40"
              >
                {busy === "deny" ? "Sealing…" : "Deny"}
              </button>
              <button
                type="button"
                disabled={!gate.ok || busy !== null}
                onClick={() => void decide("escalate")}
                className="rounded-full border border-line px-4 py-2 disabled:opacity-40"
              >
                {busy === "escalate" ? "Sealing…" : "Escalate further"}
              </button>
            </div>
            {error ? <p className="text-sm text-seal">{error}</p> : null}
          </div>
        ) : null}

        {intent.decisions.length > 0 ? (
          <ol className="mt-6 space-y-2">
            {intent.decisions.map((decision) => {
              const who = world.principals.find((p) => p.id === decision.principalId);
              return (
                <li
                  key={decision.signature}
                  className="rounded-xl border border-line/80 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <span>
                      {who?.name} · {decision.action}
                    </span>
                    <span className="text-ink-soft">{formatWhen(decision.at)}</span>
                  </div>
                  {decision.note ? (
                    <p className="mt-1 text-ink-soft">{decision.note}</p>
                  ) : null}
                  <p className="mt-1 font-mono text-[11px] text-ink-soft">
                    sig {shortHash(decision.signature)}
                  </p>
                </li>
              );
            })}
          </ol>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/demo/evidence/${intent.id}`}
          className="rounded-full bg-ink px-4 py-2 text-sm text-paper"
        >
          Open evidence pack
        </Link>
        <Link href="/demo/intents" className="rounded-full border border-line px-4 py-2 text-sm">
          All intents
        </Link>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line/60 py-1.5">
      <dt className="text-ink-soft">{k}</dt>
      <dd className={`text-right ${mono ? "break-all font-mono text-xs" : ""}`}>{v}</dd>
    </div>
  );
}
