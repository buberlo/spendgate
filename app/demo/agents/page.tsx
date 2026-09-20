"use client";

import Link from "next/link";
import { Pill } from "@/components/Pill";
import { shortHash } from "@/lib/hash";
import { useStore } from "@/lib/store";

export default function AgentsPage() {
  const { world } = useStore();
  if (!world) return null;

  return (
    <div className="space-y-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-brass">
          Identity
        </p>
        <h1 className="font-serif text-4xl">Bound agents</h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          An agent is not a shopper UI. It is a named runtime identity bound to
          a principal on a sealed mandate. A mismatched fingerprint is a hard
          deny.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {world.agents.map((agent) => {
          const principal = world.principals.find(
            (p) => p.id === agent.boundPrincipalId,
          );
          const contract = world.contracts.find((c) => c.agentId === agent.id);
          const policy = world.policies.find((p) => p.id === contract?.policyId);
          return (
            <article
              key={agent.id}
              className="rounded-2xl border border-line bg-white/70 p-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">{agent.name}</h2>
                <Pill tone={agent.status}>{agent.status}</Pill>
              </div>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Runtime</dt>
                  <dd className="font-mono text-xs">{agent.runtime}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Fingerprint</dt>
                  <dd className="font-mono text-xs">
                    {shortHash(agent.identityFingerprint, 10, 6)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Bound principal</dt>
                  <dd>{principal?.name}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-soft">Policy</dt>
                  <dd>
                    {policy ? (
                      <Link href={`/demo/policies/${policy.id}`} className="underline">
                        {policy.name}
                      </Link>
                    ) : (
                      "unbound"
                    )}
                  </dd>
                </div>
              </dl>
              <Link
                href={`/demo/intents?agent=${agent.id}`}
                className="mt-4 inline-flex rounded-full border border-line px-3 py-1.5 text-sm"
              >
                Simulate intent
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
