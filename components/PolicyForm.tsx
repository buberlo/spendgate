"use client";

import Link from "next/link";
import { useState } from "react";
import {
  categoryLabel,
  clockToMinute,
  formatEUR,
  kindLabel,
  minuteToClock,
  parseEuroToCents,
  roleLabel,
} from "@/lib/format";
import { emptyDraftPolicy } from "@/lib/seed";
import { useStore } from "@/lib/store";
import {
  MERCHANT_CATEGORIES,
  POLICY_KINDS,
  PRINCIPAL_ROLES,
  type NewPolicyInput,
} from "@/lib/types";
import { useRouter } from "next/navigation";

const STEPS = ["Scope", "Principals", "Contract", "Agent", "Seal"];

export function PolicyForm() {
  const router = useRouter();
  const { createPolicy } = useStore();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<NewPolicyInput>(emptyDraftPolicy());

  function updatePrincipal(
    index: number,
    patch: Partial<NewPolicyInput["principals"][number]>,
  ) {
    setDraft((prev) => {
      const principals = prev.principals.map((person, i) =>
        i === index ? { ...person, ...patch } : person,
      );
      return { ...prev, principals };
    });
  }

  async function seal() {
    setError(null);
    if (!draft.name.trim()) {
      setError("Name the policy.");
      setStep(0);
      return;
    }
    if (draft.principals.some((p) => !p.name.trim())) {
      setError("Every principal needs a name.");
      setStep(1);
      return;
    }
    if (draft.contract.allowedCategories.length === 0) {
      setError("Allow at least one merchant category.");
      setStep(2);
      return;
    }
    if (!draft.agent.name.trim()) {
      setError("Name the bound agent.");
      setStep(3);
      return;
    }
    setBusy(true);
    try {
      const { policyId } = await createPolicy(draft);
      router.push(`/demo/policies/${policyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not seal mandate.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-full px-3 py-1 text-sm ${
                index === step ? "bg-ink text-paper" : "bg-paper-2 text-ink-soft"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section className="space-y-4 rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="font-serif text-2xl">Policy scope</h2>
          <label className="block text-sm">
            Name
            <input
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Müller shared wallet"
            />
          </label>
          <label className="block text-sm">
            Kind
            <select
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2"
              value={draft.kind}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  kind: e.target.value as NewPolicyInput["kind"],
                })
              }
            >
              {POLICY_KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kindLabel(kind)}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-ink-soft">
            Jurisdiction is stamped EU on every mandate in this MVP.
          </p>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4 rounded-2xl border border-line bg-white/70 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Principals & hierarchy</h2>
            <button
              type="button"
              className="text-sm text-seal"
              onClick={() =>
                setDraft({
                  ...draft,
                  principals: [
                    ...draft.principals,
                    {
                      name: "",
                      email: "",
                      role: "approver",
                      rank: draft.principals.length,
                      autoApproveCents: 10_000,
                      hardApproveCents: 50_000,
                    },
                  ],
                })
              }
            >
              Add principal
            </button>
          </div>
          <p className="text-sm text-ink-soft">
            Rank 0 spends. Higher ranks approve. Hard-approve 0 means that
            principal cannot clear an escalation. Leave hard-approve empty for
            unlimited (typical owner).
          </p>
          <div className="space-y-4">
            {draft.principals.map((person, index) => (
              <div key={index} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-2">
                <label className="text-sm">
                  Name
                  <input
                    className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
                    value={person.name}
                    onChange={(e) => updatePrincipal(index, { name: e.target.value })}
                  />
                </label>
                <label className="text-sm">
                  Email
                  <input
                    className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
                    value={person.email}
                    onChange={(e) => updatePrincipal(index, { email: e.target.value })}
                  />
                </label>
                <label className="text-sm">
                  Role
                  <select
                    className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
                    value={person.role}
                    onChange={(e) =>
                      updatePrincipal(index, {
                        role: e.target.value as (typeof PRINCIPAL_ROLES)[number],
                      })
                    }
                  >
                    {PRINCIPAL_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {roleLabel(role)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Rank
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
                    value={person.rank}
                    onChange={(e) =>
                      updatePrincipal(index, { rank: Number(e.target.value) })
                    }
                  />
                </label>
                <label className="text-sm">
                  Auto-approve (EUR)
                  <input
                    className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
                    defaultValue={(person.autoApproveCents / 100).toString()}
                    onBlur={(e) =>
                      updatePrincipal(index, {
                        autoApproveCents: parseEuroToCents(e.target.value),
                      })
                    }
                  />
                </label>
                <label className="text-sm">
                  Hard-approve (EUR, blank = unlimited)
                  <input
                    className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
                    defaultValue={
                      person.hardApproveCents === null
                        ? ""
                        : (person.hardApproveCents / 100).toString()
                    }
                    onBlur={(e) =>
                      updatePrincipal(index, {
                        hardApproveCents:
                          e.target.value.trim() === ""
                            ? null
                            : parseEuroToCents(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4 rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="font-serif text-2xl">Per-intent spend contract</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["perIntentCents", "Per intent (EUR)"],
                ["dailyCents", "Daily (EUR)"],
                ["weeklyCents", "Weekly (EUR)"],
                ["monthlyCents", "Monthly (EUR)"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="text-sm">
                {label}
                <input
                  className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
                  defaultValue={(draft.contract[key] / 100).toString()}
                  onBlur={(e) =>
                    setDraft({
                      ...draft,
                      contract: {
                        ...draft.contract,
                        [key]: parseEuroToCents(e.target.value),
                      },
                    })
                  }
                />
              </label>
            ))}
            <label className="text-sm">
              Window start
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
                value={minuteToClock(draft.contract.window.startMinute)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    contract: {
                      ...draft.contract,
                      window: {
                        ...draft.contract.window,
                        startMinute: clockToMinute(e.target.value),
                      },
                    },
                  })
                }
              />
            </label>
            <label className="text-sm">
              Window end
              <input
                type="time"
                className="mt-1 w-full rounded-lg border border-line px-2 py-1.5"
                value={minuteToClock(draft.contract.window.endMinute)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    contract: {
                      ...draft.contract,
                      window: {
                        ...draft.contract.window,
                        endMinute: clockToMinute(e.target.value),
                      },
                    },
                  })
                }
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm">Allowed categories</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {MERCHANT_CATEGORIES.map((category) => {
                const on = draft.contract.allowedCategories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      const allowed = on
                        ? draft.contract.allowedCategories.filter((c) => c !== category)
                        : [...draft.contract.allowedCategories, category];
                      const denied = allowed.includes(category)
                        ? draft.contract.deniedCategories.filter((c) => c !== category)
                        : draft.contract.deniedCategories;
                      setDraft({
                        ...draft,
                        contract: {
                          ...draft.contract,
                          allowedCategories: allowed,
                          deniedCategories: denied,
                        },
                      });
                    }}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      on ? "border-ink bg-ink text-paper" : "border-line"
                    }`}
                  >
                    {categoryLabel(category)}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4 rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="font-serif text-2xl">Bind an agent identity</h2>
          <label className="block text-sm">
            Agent name
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={draft.agent.name}
              onChange={(e) =>
                setDraft({ ...draft, agent: { ...draft.agent, name: e.target.value } })
              }
              placeholder="e.g. HouseShopper"
            />
          </label>
          <label className="block text-sm">
            Runtime
            <input
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={draft.agent.runtime}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  agent: { ...draft.agent, runtime: e.target.value },
                })
              }
              placeholder="anthropic / openai / internal"
            />
          </label>
          <label className="block text-sm">
            Bound principal
            <select
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={draft.agent.boundPrincipalIndex}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  agent: {
                    ...draft.agent,
                    boundPrincipalIndex: Number(e.target.value),
                  },
                })
              }
            >
              {draft.principals.map((person, index) => (
                <option key={index} value={index}>
                  {person.name || `Principal ${index + 1}`} ({roleLabel(person.role)})
                </option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4 rounded-2xl border border-line bg-white/70 p-5">
          <h2 className="font-serif text-2xl">Seal the mandate</h2>
          <p className="text-ink-soft">
            Issuing writes an immutable snapshot: principals, hierarchy, spend
            contract, agent fingerprint. The audit log appends{" "}
            <span className="font-mono text-xs">MANDATE_SEALED</span>.
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Policy</dt>
              <dd>
                {draft.name || "Untitled"} · {kindLabel(draft.kind)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Principals</dt>
              <dd>{draft.principals.map((p) => p.name || "—").join(" · ")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Per-intent cap</dt>
              <dd>{formatEUR(draft.contract.perIntentCents)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Agent</dt>
              <dd>
                {draft.agent.name || "—"} →{" "}
                {draft.principals[draft.agent.boundPrincipalIndex]?.name || "—"}
              </dd>
            </div>
          </dl>
          <label className="block text-sm">
            Issued by
            <select
              className="mt-1 w-full rounded-xl border border-line px-3 py-2"
              value={draft.issuedByPrincipalIndex}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  issuedByPrincipalIndex: Number(e.target.value),
                })
              }
            >
              {draft.principals.map((person, index) => (
                <option key={index} value={index}>
                  {person.name || `Principal ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        </section>
      ) : null}

      {error ? <p className="text-sm text-seal">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        {step > 0 ? (
          <button
            type="button"
            className="rounded-full border border-line px-4 py-2"
            onClick={() => setStep(step - 1)}
          >
            Back
          </button>
        ) : (
          <Link href="/demo/policies" className="rounded-full border border-line px-4 py-2">
            Cancel
          </Link>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            className="rounded-full bg-ink px-4 py-2 text-paper"
            onClick={() => setStep(step + 1)}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            className="rounded-full bg-seal px-4 py-2 text-paper disabled:opacity-60"
            onClick={() => void seal()}
          >
            {busy ? "Sealing…" : "Issue mandate"}
          </button>
        )}
      </div>
    </div>
  );
}
