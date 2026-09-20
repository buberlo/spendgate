"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Pill } from "@/components/Pill";
import { evaluateIntent } from "@/lib/engine";
import {
  categoryLabel,
  formatEUR,
  formatWhen,
  parseEuroToCents,
} from "@/lib/format";
import { INTENT_PRESETS } from "@/lib/presets";
import { useStore } from "@/lib/store";
import { MERCHANT_CATEGORIES, type IntentDraft, type MerchantCategory } from "@/lib/types";

function IntentsInner() {
  const { world, submitIntent } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const presetAgent = params.get("agent");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<IntentDraft>(() => ({
    agentId: presetAgent || INTENT_PRESETS[0].draft.agentId,
    merchantName: "REWE",
    merchantCategory: "groceries",
    declaredPurpose: "Household groceries restock",
    amountCents: 3_280,
    occurredAt: "2026-09-20T11:05:00.000Z",
  }));

  const preview = useMemo(
    () => (world ? evaluateIntent(world, draft) : null),
    [world, draft],
  );

  if (!world) return null;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const intent = await submitIntent(draft);
      router.push(`/demo/intents/${intent.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
          Simulator
        </p>
        <h1 className="font-serif text-4xl">Purchase intents</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Submit a synthetic intent as a bound agent. The gate evaluates identity,
          mandate, category, window, caps, then the principal hierarchy.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="font-serif text-2xl">Compose intent</h2>
          <div className="flex flex-wrap gap-2">
            {INTENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setDraft({ ...preset.draft })}
                className="rounded-full border border-line px-3 py-1 text-sm hover:bg-paper"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label className="block text-sm">
            Agent
            <select
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={draft.agentId}
              onChange={(e) => setDraft({ ...draft, agentId: e.target.value })}
            >
              {world.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.runtime})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Merchant
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={draft.merchantName}
              onChange={(e) => setDraft({ ...draft, merchantName: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            Declared purpose
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={draft.declaredPurpose}
              onChange={(e) =>
                setDraft({ ...draft, declaredPurpose: e.target.value })
              }
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Category
              <select
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                value={draft.merchantCategory}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    merchantCategory: e.target.value as MerchantCategory,
                  })
                }
              >
                {MERCHANT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {categoryLabel(category)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Amount (EUR)
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2"
                defaultValue={(draft.amountCents / 100).toFixed(2)}
                key={draft.amountCents}
                onBlur={(e) =>
                  setDraft({
                    ...draft,
                    amountCents: parseEuroToCents(e.target.value),
                  })
                }
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Occurred at (ISO)
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-mono text-xs"
                value={draft.occurredAt}
                onChange={(e) => setDraft({ ...draft, occurredAt: e.target.value })}
              />
            </label>
            <label className="text-sm sm:col-span-2">
              Claimed fingerprint (blank = bound identity)
              <input
                className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-mono text-xs"
                value={draft.claimedFingerprint ?? ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    claimedFingerprint: e.target.value || undefined,
                  })
                }
              />
            </label>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run()}
            className="rounded-full bg-seal px-4 py-2 text-paper disabled:opacity-60"
          >
            {busy ? "Evaluating…" : "Submit intent to the gate"}
          </button>
          {error ? <p className="text-sm text-seal">{error}</p> : null}
        </div>

        <aside className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Live evaluation</h2>
            {preview ? <Pill tone={preview.decision}>{preview.decision}</Pill> : null}
          </div>
          <p className="mt-2 text-sm text-ink-soft">{preview?.reasonSummary}</p>
          <ul className="mt-4 space-y-2">
            {preview?.findings.map((finding) => (
              <li
                key={finding.code}
                className="rounded-xl border border-line/70 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-wider">
                    {finding.code}
                  </span>
                  <Pill tone={finding.severity}>{finding.severity}</Pill>
                </div>
                <p className="mt-1">{finding.title}</p>
                <p className="text-ink-soft">{finding.detail}</p>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="rounded-2xl border border-line bg-white/70 p-5">
        <h2 className="font-serif text-2xl">Ledger of intents</h2>
        <ul className="mt-4 divide-y divide-line/70">
          {world.intents.map((intent) => (
            <li key={intent.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p>
                  <Link href={`/demo/intents/${intent.id}`} className="font-medium hover:underline">
                    {intent.merchantName}
                  </Link>{" "}
                  · {formatEUR(intent.amountCents)}
                </p>
                <p className="text-sm text-ink-soft">
                  {intent.snapshot.agent.name} · {formatWhen(intent.submittedAt)} ·{" "}
                  {intent.declaredPurpose}
                </p>
              </div>
              <Pill tone={intent.status}>{intent.status}</Pill>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function IntentsPage() {
  return (
    <Suspense fallback={<p className="font-serif text-2xl">Loading intents…</p>}>
      <IntentsInner />
    </Suspense>
  );
}
